// LimpeJaApp/src/services/paymentService.ts
import { api } from './api';

export const processPayment = async (paymentDetails: { bookingId: string, paymentMethodId: string, amount: number }) => {
  console.log('paymentService: processing payment:', paymentDetails);
  // const response = await api.post('/payments/process', paymentDetails);
  // return response.data; // Ex: { success: true, transactionId: '...' }
  return Promise.resolve({ success: true, transactionId: 'trans' + Date.now() }); // Mock
};

export const addPaymentMethod = async (paymentMethodData: { /* token, cardDetails, etc. */ }) => {
  console.log('paymentService: adding payment method:', paymentMethodData);
  // const response = await api.post('/payments/add-method', paymentMethodData);
  // return response.data; // Ex: { success: true, paymentMethodId: '...' }
  return Promise.resolve({ success: true, paymentMethodId: 'pm_' + Date.now() }); // Mock
};

export const getClientPaymentMethods = async () => {
  console.log('paymentService: fetching client payment methods');
  // const response = await api.get('/payments/methods');
  // return response.data; // Ex: [{ id: 'pm1', last4: '4242', brand: 'visa' }]
  return Promise.resolve([{ id: 'pm1', last4: '4242', brand: 'visa', isDefault: true }]); // Mock
};

// Adicione mais funções conforme necessário (ex: provider payouts)