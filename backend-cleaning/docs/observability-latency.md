# Observability latency checklist

## Manual validation
1. Deploy the backend with `OBS_LATENCY_ENABLED=true` (default) and `OBS_LATENCY_SAMPLE_RATE_DEFAULT=1`/`OBS_LATENCY_SAMPLE_RATE_CRITICAL=1` in staging so every request is captured once while you validate.
2. Hit a critical route (`/api/bookings`, `/api/payments`, `/api/payouts`, `/api/auth`, `/api/safety`) and a non-critical route (e.g., `/api/providers/123`) using `curl`, Postman, or automated smoke scripts.
3. Fetch `GET /admin/health` (or call `AdminObservabilityService.getSnapshot`) and confirm:
   - `latencySeries` contains entries for the routes you just exercised.
   - The reported keys look normalized (IDs replaced by `{id}`) and the series reports recent timestamps.
   - `db.latencyMs` plus any other shard timings match the expected context.

## Adjusting the sampling env vars
- `OBS_LATENCY_ENABLED`: `true`/`false` controls whether the interceptor runs at all (default `true`).
- `OBS_LATENCY_SAMPLE_RATE_DEFAULT`: floating number in `[0.01, 1]` for non-critical routes; lower it to reduce overhead.
- `OBS_LATENCY_SAMPLE_RATE_CRITICAL`: floating number in `[0.01, 1]` for critical prefixes (`/api/bookings`, `/api/payments`, `/api/payouts`, `/api/auth`, `/api/safety`). Set to `1` for full visibility.
- Update `.env`, restart the service, and rerun the manual validation above to confirm the sampling behaves as expected.

## Cardinality / Redis sanity check
1. In production, latency data is persisted per normalized route. Check Redis (or the backing store) for keys such as `observability:latency:/api/providers/{id}` or whatever prefix your deployment uses.
2. Use `redis-cli --scan --pattern 'observability:*latency*' | wc -l` to ensure you do not have exploding cardinality; the normalized route names should collapse `/api/providers/123` and `/api/providers/999` into the same key.
3. When diagnosing spikes, prefer looking at the normalized key in `/admin/health` rather than raw URLs with dynamic segments to keep the buffer focused on real slices of traffic.

## Validating latencySeries routing
1. Start the backend (`npm run start` or your usual command).
2. Execute `curl -s -o /dev/null http://localhost:3000/api/search` 20 times (or use a loop/script).
3. Request `GET http://localhost:3000/admin/health`.
4. Confirm `latencySeries` contains entries and the route key shown is `/api/search`.
5. Use `latencySeries` timestamps to trace the most recent samples for `/api/search`.

## Preenchendo o buffer antes de abrir o painel
1. Ensure `$token` holds a valid admin token and `$searchUrl` points to the `/api/search` endpoint of the instance under test; without both the calls will never reach the backend.
2. Run a loop (PowerShell, bash, Postman, etc.) that calls `$searchUrl` with the header `Authorization: Bearer $token`, waiting 7 seconds between each request so the latency buffer fills steadily. Example:

```powershell
$searchUrl = 'https://staging.relax.com.br/api/search'
$token = 'eyJ...'

for ($i = 0; $i -lt 10; $i++) {
  Invoke-RestMethod -Uri $searchUrl -Headers @{ Authorization = "Bearer $token" } | Out-Null
  Start-Sleep -Seconds 7
}
```

3. Immediately after the loop, call `GET /admin/health?routeKey=/search` with the same token; that endpoint reads the warmed buffer and forwards the series to the frontend.
4. Refresh the observability panel so the graph picks up the latest points and the `/search` route key reflects the new samples.
5. Need higher frequency? Increase `observability.latency.sampleRateDefault` and/or `.sampleRateCritical` in `config/configuration.ts` (or via `OBS_LATENCY_SAMPLE_RATE_*` env vars). The interceptor already honors those values and controls how many samples make it into the buffer.
