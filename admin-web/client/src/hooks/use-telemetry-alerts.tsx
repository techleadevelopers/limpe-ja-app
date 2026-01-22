import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  API_BASE_URL,
  fetchUserProfileById,
  forceLogoutUser,
  updateProviderVisibility,
} from "@/lib/api";
import { ProviderVisibilityStatus, type UserProfile } from "@/lib/types";

type TelemetryAnomalyPayload = {
  userId: string;
  path: string;
  count: number;
  windowSeconds: number;
  timestamp: string;
};

const TELEMETRY_EVENT = "telemetryAnomaly";

const resolveProfile = async (
  cache: Map<string, UserProfile | null>,
  userId: string,
): Promise<UserProfile | null> => {
  if (cache.has(userId)) {
    return cache.get(userId) ?? null;
  }

  try {
    const profile = await fetchUserProfileById(userId);
    cache.set(userId, profile);
    return profile;
  } catch (error) {
    cache.set(userId, null);
    console.warn("[Telemetry] failed to resolve user profile", error);
    return null;
  }
};

export function useTelemetryAlerts() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const profileCache = useRef(new Map<string, UserProfile | null>());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      return;
    }

    const socket = io(API_BASE_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      query: { token: `Bearer ${token}` },
    });

    socketRef.current = socket;

    const handleBlockAction = async (
      providerId: string | undefined,
      displayName: string,
      close: () => void,
    ) => {
      if (!providerId) {
        toast({
          title: "Bloqueio não aplicado",
          description: "Usuário não está vinculado a um provedor visível.",
          variant: "warning",
        });
        return;
      }

      try {
        await updateProviderVisibility(
          providerId,
          ProviderVisibilityStatus.VITRINE_IRREGULAR,
          "Loop de requests detectado pelo painel de telemetria",
        );
        toast({
          title: "Bloqueio aplicado",
          description: `${displayName} foi removido da vitrine temporariamente.`,
          variant: "success",
        });
        close?.();
      } catch (error: unknown) {
        toast({
          title: "Erro ao bloquear",
          description:
            (error as Error).message ?? "Não foi possível bloquear o provedor.",
          variant: "destructive",
        });
      }
    };

    const handleForceLogoutAction = async (
      userId: string,
      close: () => void,
    ) => {
      try {
        await forceLogoutUser(userId);
        toast({
          title: "Logout forçado",
          description: "Enviamos a ordem para encerrar a sessão deste usuário.",
          variant: "success",
        });
        close?.();
      } catch (error: unknown) {
        toast({
          title: "Erro ao forçar logout",
          description:
            (error as Error).message ?? "Não foi possível encerrar a sessão.",
          variant: "destructive",
        });
      }
    };

    const handleAnomaly = async (payload: TelemetryAnomalyPayload) => {
      if (!payload?.userId) {
        return;
      }

      const profile = await resolveProfile(profileCache.current, payload.userId);
      const displayName =
        profile?.providerDetails?.fullName ??
        profile?.clientDetails?.fullName ??
        profile?.fullName ??
        profile?.email ??
        payload.userId;
      const providerId = profile?.providerDetails?.id;
      const timestampLabel = (() => {
        const time = Date.parse(payload.timestamp);
        return Number.isFinite(time)
          ? new Date(time).toLocaleTimeString()
          : "";
      })();

      const anomalyToast = toast({
        title: `🚨 USUÁRIO EM LOOP: ${displayName}`,
        description: (
          <div className="space-y-2 text-xs text-white/90">
            <p>ID: {payload.userId}</p>
            <p>Endpoint: {payload.path}</p>
            <p>
              Hits: {payload.count} em {payload.windowSeconds}s
            </p>
            {timestampLabel && (
              <p className="text-[10px] uppercase tracking-wider text-white/60">
                {timestampLabel}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:border-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() =>
                  handleBlockAction(
                    providerId,
                    displayName,
                    () => anomalyToast.dismiss(),
                  )
                }
              >
                Bloquear temporariamente
              </button>
              <button
                type="button"
                className="rounded-full border border-red-300/50 bg-red-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-red-100 transition hover:border-red-200 hover:bg-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-300"
                onClick={() =>
                  handleForceLogoutAction(
                    payload.userId,
                    () => anomalyToast.dismiss(),
                  )
                }
              >
                Forçar logout
              </button>
            </div>
          </div>
        ),
        variant: "destructive",
      });
    };

    socket.on(TELEMETRY_EVENT, handleAnomaly);
    socket.on("connect_error", (error) => {
      console.warn("[Telemetry] socket connection failed", error);
    });

    return () => {
      socket.off(TELEMETRY_EVENT, handleAnomaly);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, toast]);
}

export function TelemetryAlertsBridge() {
  useTelemetryAlerts();
  return null;
}
