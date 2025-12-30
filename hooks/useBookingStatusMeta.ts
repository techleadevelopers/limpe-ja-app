import { useEffect, useMemo, useState } from 'react';
import { getBookingStatusesMeta } from '../services/metaService';
import { BookingStatusMeta, MetaStatusesResponse } from '../types/backend/meta';

export function useBookingStatusMeta() {
  const [meta, setMeta] = useState<MetaStatusesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getBookingStatusesMeta()
      .then((data) => {
        if (isMounted) {
          setMeta(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMeta(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const statusMap = useMemo<Record<string, BookingStatusMeta>>(() => {
    if (!meta) return {};
    return meta.bookingStatuses.reduce((acc, item) => {
      acc[item.status] = item;
      return acc;
    }, {} as Record<string, BookingStatusMeta>);
  }, [meta]);

  return { meta, statusMap, isLoading };
}
