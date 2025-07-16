// LimpeJaApp/app/(auth)/components/InputWithIcon.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputWithIconProps {
    iconName: keyof typeof Ionicons.glyphMap; // Tipo para ícones Ionicons (renomeado de 'icon' para 'iconName' para clareza)
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    maxLength?: number;
    secureTextEntry?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    style?: any; // Para estilos adicionais passados do componente pai
    onPressEye?: () => void; // Para o ícone de olho da senha
    showEyeIcon?: boolean;
}

export const InputWithIcon: React.FC<InputWithIconProps> = ({
    iconName, // Usar iconName
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    maxLength,
    secureTextEntry = false,
    textAlign = 'left',
    style, // Estilos adicionais do pai serão aplicados aqui
    onPressEye,
    showEyeIcon,
}) => {
    return (
        <View style={[internalStyles.inputWrapper, style]}> {/* Aplica estilos internos e depois os passados via prop */}
            <View style={internalStyles.iconCircle}>
                <Ionicons name={iconName} size={18} color="#00BCD4" />
            </View>
            <TextInput
                style={[internalStyles.input, { textAlign }]}
                placeholder={placeholder}
                placeholderTextColor="#A0AEC0"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                maxLength={maxLength}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
            />
            {showEyeIcon && (
                <TouchableOpacity onPress={onPressEye} style={internalStyles.eyeIconTouchable}>
                    <Ionicons name={secureTextEntry ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                </TouchableOpacity>
            )}
        </View>
    );
};

// Estilos específicos para o InputWithIcon, agora definidos internamente
const internalStyles = StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 33,
        // O 'bottom: 55' é um estilo de posicionamento que pode ser muito específico para o layout do LoginScreen.
        // Se este componente for reutilizado em outros lugares, considere removê-lo daqui e aplicá-lo no componente pai,
        // ou passá-lo via 'style' prop. Mantido por enquanto para replicar a UI original.
        bottom: 55, 
        marginBottom: 10,
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        paddingLeft: 5,
        paddingRight: 15,
    },
    iconCircle: {
        width: 50,
        height: 30,
        right: 2,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        right: 8,
        height: '70%',
        paddingVertical: 0,
    },
    eyeIconTouchable: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
    },
});