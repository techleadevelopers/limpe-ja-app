import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import SecaoPrestadores from '../../../../components/client/explore/home/SecaoPrestadores';
import { filterByRadiusOrCity } from '../utils/locationFilter';

const makeProvider = (overrides: Partial<Record<string, any>>) => ({
  id: overrides.id ?? 'provider',
  userId: overrides.userId ?? 'user',
  fullName: overrides.fullName ?? 'Nome Teste',
  email: overrides.email ?? 'teste@demo.clean',
  averageRating: overrides.averageRating ?? 5,
  reviewCount: overrides.reviewCount ?? 1,
  yearsOfExperience: overrides.yearsOfExperience ?? 2,
  createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2025-01-01T00:00:00.000Z',
  user: {
    email: overrides.user?.email ?? 'teste@demo.clean',
    role: overrides.user?.role ?? 'CLIENT',
    isVerified: overrides.user?.isVerified ?? false,
  },
  address: overrides.address ?? {},
  distance: overrides.distance,
  ...overrides,
});

describe('Provider search radius', () => {
  it('renders only providers within the configured radius', () => {
    const response = [
      makeProvider({
        id: 'provider-a',
        fullName: 'Provider A',
        distance: 800,
      }),
      makeProvider({
        id: 'provider-b',
        fullName: 'Provider B',
        distance: 2000,
      }),
    ];

    const radiusMeters = 1000;
    const hint = { city: 'Campinas', state: 'SP' };
    const filtered = filterByRadiusOrCity(response, radiusMeters, hint);

    const { getByText, queryByText } = render(
      <SecaoPrestadores
        titulo="Resultados"
        onVerTudoPress={() => {}}
        data={filtered}
        renderItem={({ item }) => <Text key={item.id}>{item.fullName}</Text>}
      />,
    );

    expect(getByText('Provider A')).toBeTruthy();
    expect(queryByText('Provider B')).toBeNull();
  });
});
