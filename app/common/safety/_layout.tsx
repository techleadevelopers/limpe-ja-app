// LimpeJaApp/app/common/safety/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

/**
 * Layout component for the common safety section.
 * Defines the navigation stack for safety-related screens accessible by all user types.
 */
export default function SafetyLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Segurança e Emergência',
                }}
            />
            <Stack.Screen
                name="panic"
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Botão de Pânico',
                }}
            />
            <Stack.Screen
                name="incident-report"
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Relatar Incidente',
                }}
            />
        </Stack>
    );
}