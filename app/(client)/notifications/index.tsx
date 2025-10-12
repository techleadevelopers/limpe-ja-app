import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getMyNotifications, markAllNotificationsAsRead, markNotificationAsRead, AppNotification } from '../../../services/notificationService';
import { useOverlayMessage } from '../../../hooks/useOverlayMessage';

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { showOverlay } = useOverlayMessage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications','me'],
    queryFn: getMyNotifications,
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications','me'] });
      showOverlay({ titleKey: 'overlay.notifications.readAll', title: 'Notificações marcadas como lidas', variant: 'success' });
    }
  });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications','me'] })
  });

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity style={[styles.item, !item.isRead && styles.itemUnread]} onPress={() => markOne.mutate(item.id)}>
      <View style={styles.itemLeft}>
        <Ionicons name={item.isRead ? 'notifications-outline' : 'notifications'} size={20} color={item.isRead ? '#64748b' : '#2563eb'} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemBodyText} numberOfLines={2}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notificações', headerShadowVisible: false }} />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAll.mutate()}>
          <Ionicons name="checkmark-done" size={16} color="#2563eb" />
          <Text style={styles.markAllText}>Marcar todas</Text>
        </TouchableOpacity>
      </View>
      {isLoading && (
        <View style={styles.center}><Text>Carregando...</Text></View>
      )}
      {isError && (
        <View style={styles.center}><Text>Não foi possível carregar.</Text></View>
      )}
      {!isLoading && !isError && (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          ListEmptyComponent={<View style={styles.center}><Text>Sem notificações.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8FF' },
  actions: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eef6ff' },
  markAllText: { color: '#2563eb', fontWeight: '600' },
  center: { padding: 24, alignItems: 'center' },
  item: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: '#2563eb' },
  itemLeft: { width: 28, alignItems: 'center' },
  itemBody: { flex: 1, marginLeft: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemBodyText: { fontSize: 12, color: '#475569', marginTop: 2 },
});

