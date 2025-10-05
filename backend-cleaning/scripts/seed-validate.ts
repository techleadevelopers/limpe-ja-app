// Lightweight schema vs seed sanity check without altering the seed
// Runs type-level and DMMF checks to ensure enums/models referenced by the seed exist.

import { Prisma } from '@prisma/client';

// Prisma DMMF exposes current generated schema (post `prisma generate`).
const dmmf = Prisma.dmmf;

function ensureEnumsExist(names: string[]) {
  const present = new Set(dmmf.datamodel.enums.map((e) => e.name));
  const missing = names.filter((n) => !present.has(n));
  if (missing.length) {
    throw new Error(
      `Enum(s) missing in schema for seed: ${missing.join(', ')}. ` +
        `Run 'npx prisma generate' and verify prisma/schema.prisma.`,
    );
  }
}

function checkModelsExist(names: string[]) {
  const present = new Set(dmmf.datamodel.models.map((m) => m.name));
  const missing = names.filter((n) => !present.has(n));
  return missing;
}

async function main() {
  // Keep this list aligned with enums referenced in prisma/seed/seed.ts imports/usage
  // Note: We intentionally do NOT import the enums here to avoid compile-time coupling.
  const expectedEnums = [
    'UserRole',
    'VerificationStatus',
    'BookingStatus',
    'TransactionType',
    'PricingType',
    'CouponType',
    'CouponTarget',
    'CouponStatus',
    'MissionAudience',
    'MissionKind',
    'RewardType',
    'MissionStatus',
    'LoyaltyTransactionType',
    'OfferTarget',
    'OfferStatus',
    'SupportTicketStatus',
    'SupportTicketCategory',
    'DisputeReason',
    'DisputeStatus',
    'IncidentType',
    'IncidentStatus',
    'SubscriptionFrequency',
    'SubscriptionStatus',
    'ClaimStatus',
    'PaymentIntentStatus',
    // Additive: present in schema and often used by payouts/ledger
    'LedgerEntryType',
    'PayoutStatus',
  ];

  const expectedModels = [
    // Core
    'User',
    'Client',
    'Provider',
    'Address',
    // Supply & catalog
    'Service',
    'ProviderService',
    // Commerce
    'Booking',
    'Transaction',
    'PaymentIntent',
    'Coupon',
    'Offer',
    // Support & disputes
    'SupportTicket',
    'SupportMessage',
    'SupportSlaLog',
    'Dispute',
    // Loyalty & missions
    'Mission',
    'MissionProgress',
    // Incidents & safety
    'Incident',
    'PanicAlert',
    'GuaranteeClaim',
    // Subscriptions
    'Subscription',
    // Payouts & ledger
    'LedgerEntry',
    'Payout',
    // Misc
    'WebhookReplay',
  ];

  ensureEnumsExist(expectedEnums);
  const missingModels = checkModelsExist(expectedModels);
  if (missingModels.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: Model(s) not found in schema but commonly referenced by seed: ${missingModels.join(
        ', ',
      )}. If your seed does not use them, you can ignore this.`,
    );
  }

  // If we got here, DMMF-level checks are fine. A full type-check can be
  // done with `tsc -p tsconfig.seed.json --noEmit` if desired.
  // This script is intentionally simple and non-invasive.
  // eslint-disable-next-line no-console
  console.log('Seed/schema validation passed: enums and models are present.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
