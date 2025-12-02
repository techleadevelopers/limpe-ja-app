import axios from 'axios';

export type GeocodeResult = { latitude: number; longitude: number };

export async function geocodeAddress(
  addressString: string,
): Promise<GeocodeResult | null> {
  if (!addressString || !process.env.GOOGLE_MAPS_API_KEY) return null;

  try {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      address: addressString,
      key: process.env.GOOGLE_MAPS_API_KEY,
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    if (
      data?.status === 'OK' &&
      Array.isArray(data.results) &&
      data.results.length > 0
    ) {
      const location = data.results[0]?.geometry?.location;
      if (
        location &&
        typeof location.lat === 'number' &&
        typeof location.lng === 'number'
      ) {
        return { latitude: location.lat, longitude: location.lng };
      }
    }
    return null;
  } catch {
    return null;
  }
}
