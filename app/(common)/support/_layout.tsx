// LimpeJaApp/app/(common)/support/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

/**
 * Layout component for the common support section.
 * Defines the navigation stack for support-related screens accessible by all user types.
 */
export default function SupportLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Meus Tickets de Suporte',
                }}
            />
            <Stack.Screen
                name="create-ticket"
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Abrir Novo Ticket',
                }}
            />
            <Stack.Screen
                name="[ticketId]" // Dynamic route for individual ticket details
                options={{
                    headerShown: false, // Custom header will be used within the screen
                    title: 'Detalhes do Ticket',
                }}
            />
        </Stack>
    );
}