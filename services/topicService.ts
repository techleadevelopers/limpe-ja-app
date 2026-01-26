import { api } from './api';

const TOPICS_BASE = '/notifications/topics';

const callTopicEndpoint = async (action: 'subscribe' | 'unsubscribe', topic: string) => {
  const normalizedTopic = topic?.trim();
  if (!normalizedTopic) {
    return;
  }
  try {
    await api.post(`${TOPICS_BASE}/${action}`, { topic: normalizedTopic });
  } catch (error) {
    console.warn(
      `[topicService] Falha ao ${action} o tópico "${normalizedTopic}":`,
      error,
    );
    throw error;
  }
};

export const subscribeToTopic = (topic: string) =>
  callTopicEndpoint('subscribe', topic);

export const unsubscribeFromTopic = (topic: string) =>
  callTopicEndpoint('unsubscribe', topic);
