import { fetchApi } from "./api";
import type { AuditActivity } from "./types";

const AUDIT_LOG_ENDPOINT = "/admin/activities";
const AUDIT_LIMIT_MIN = 1;
const AUDIT_LIMIT_MAX = 100;

const clampLimit = (value: number): number =>
  Math.min(AUDIT_LIMIT_MAX, Math.max(AUDIT_LIMIT_MIN, value));

export const auditApi = {
  listActivities: (limit = 50): Promise<AuditActivity[]> => {
    const sanitizedLimit = clampLimit(limit);
    return fetchApi<AuditActivity[]>(`${AUDIT_LOG_ENDPOINT}?limit=${sanitizedLimit}`);
  },
};
