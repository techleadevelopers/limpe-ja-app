// LimpeJaApp/services/subscriptionService.ts
import api from './api'; // Assuming you have an api.ts for Axios instance
import {
  CreateSubscriptionDto,
  Subscription,
  UpdateSubscriptionDto,
} from '../types/backend/subscriptions';

export const createSubscription = async (data: CreateSubscriptionDto): Promise<Subscription> => {
  const response = await api.post<Subscription>('/subscriptions', data);
  return response.data;
};

export const getSubscriptionsForUser = async (): Promise<Subscription[]> => {
  const response = await api.get<Subscription[]>('/subscriptions/me');
  return response.data;
};

export const getSubscriptionDetails = async (id: string): Promise<Subscription> => {
  const response = await api.get<Subscription>(`/subscriptions/${id}`);
  return response.data;
};

export const updateSubscription = async (id: string, data: UpdateSubscriptionDto): Promise<Subscription> => {
  const response = await api.patch<Subscription>(`/subscriptions/${id}`, data);
  return response.data;
};

// generateNextBooking is called by backend, no direct frontend method needed for it.