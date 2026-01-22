This migration creates the `AuditLog` table that stores administrator audit events.

If you run into a situation where the previous `202022909_add_audit_log` migration is marked as applied but the table is missing, resolve that migration as rolled-back before running migrations again:

```
npx prisma migrate resolve --rolled-back 202022909_add_audit_log
npx prisma migrate deploy
```
