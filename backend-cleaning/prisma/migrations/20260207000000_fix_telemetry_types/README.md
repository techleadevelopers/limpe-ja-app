## Fix telemetry userId type

- Make `TelemetryForceLogout.userId` use UUID so it can safely reference `User.id`.
- Drop and re-create the FK so Postgres accepts the new column type.
