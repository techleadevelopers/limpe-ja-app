/**
 * SANITY CHECK (DEV-ONLY)
 * This script verifies that ViewDto constructors can be instantiated with
 * minimal structure so that serialization will not throw at runtime.
 * Run via `npx ts-node scripts/sanity-view-dtos.ts` when making DTO changes.
 * Not part of automated test suites.
 */

import { ProviderViewDto } from '../src/providers/dto/provider-view.dto';
import { ProviderWithCalculatedRating } from '../src/providers/providers.service';
import { MissionViewDto } from '../src/missions/dto/mission-view.dto';
import { MissionWithProgressView } from '../src/missions/progress.service';
import { BookingViewDto } from '../src/bookings/dto/booking-view.dto';
import { BookingStatus, UserRole } from '@prisma/client';
import { BookingWithDetailsRelations } from '../src/bookings/bookings.service';
import { ProviderEarningsViewDto } from '../src/earnings/dto/provider-earnings-view.dto';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`Sanity check failed: ${message}`);
  }
}

const sampleProvider: ProviderWithCalculatedRating = {
  id: 'prov-123',
  userId: 'usr-123',
  fullName: 'Test Provider',
  email: 'provider@example.com',
  avatarUrl: null,
  phone: null,
  bio: 'Bio',
  verificationStatus: 'APPROVED',
  averageRating: 5,
  reviewCount: 10,
  yearsOfExperience: 2,
  fiveStarReviewCount: 5,
  monthlyBookingsCount: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user: { email: '', role: UserRole.PROVIDER, isVerified: true },
  providerServices: [],
};

const providerDto = new ProviderViewDto(sampleProvider);
assert(typeof providerDto.isVerified === 'boolean', 'ProviderViewDto.isVerified missing');

const sampleMission: MissionWithProgressView = {
  mission: {
    id: 'mission-1',
    code: 'code',
    title: 'Mission',
    description: 'desc',
    audience: 'CLIENT',
    kind: 'COUNT_EVENT',
    eventName: 'event',
    targetValue: 1,
    rewardType: 'POINTS',
    rewardValue: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  progress: {
    id: 'progress-1',
    status: 'COMPLETED',
    currentValue: 1,
    completedAt: new Date(),
    claimedAt: null,
    lastEventAt: new Date(),
  },
  percent: 100,
  canClaim: true,
};

const missionDto = new MissionViewDto(sampleMission);
assert(typeof missionDto.isCompleted === 'boolean', 'MissionViewDto.isCompleted missing');

const sampleBooking: BookingWithDetailsRelations = {
  id: 'booking-1',
  clientId: 'client-1',
  providerId: 'prov-123',
  providerServiceId: 'service-1',
  scheduledDate: new Date().toISOString(),
  scheduledTime: '09:00',
  status: BookingStatus.PENDING_PROVIDER_CONFIRMATION,
  totalPrice: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  addressId: null,
  address: {
    id: 'addr',
    cep: '12345',
    street: 'street',
    number: '1',
    complement: null,
    neighborhood: 'hood',
    city: 'city',
    state: 'ST',
    latitude: 0,
    longitude: 0,
  },
  client: { id: 'client-1', fullName: 'Client', user: { id: 'user', email: '', role: UserRole.CLIENT, isVerified: false } },
  provider: { id: 'prov-123', fullName: 'Provider', user: { id: 'user', email: '', role: UserRole.PROVIDER, isVerified: true } },
  providerService: { id: 'service-1', price: 100, serviceId: 'svc', providerId: 'prov-123', durationMinutes: 60, description: 'desc', pricingType: 'FIXED_PRICE', service: { id: 'svc', name: 'Cleaning', categoryId: 'cat', createdAt: new Date(), updatedAt: new Date() } },
  review: null,
  subscription: null,
  incidents: [],
  guaranteeClaims: [],
  coupon: null,
  paymentIntent: null,
};

const bookingDto = new BookingViewDto(sampleBooking, { userRole: UserRole.PROVIDER });
assert(
  typeof bookingDto.showAcceptRejectActions === 'boolean',
  'BookingViewDto.showAcceptRejectActions missing',
);

const earningsView = new ProviderEarningsViewDto(1000, 120);
assert(earningsView.canWithdraw, 'ProviderEarningsViewDto.canWithdraw should be true');

console.log('Sanity check passed: view DTOs instantiate correctly.');
