// LimpeJaApp/app/client/metrics/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

/**
 * Layout component for the client metrics section.
 * Defines the navigation stack for metric-related screens.
 */
export default function MetricsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Minhas Métricas',
                }}
            />
            {/* Additional metric-related screens can be added here if needed */}
        </Stack>
    );
}