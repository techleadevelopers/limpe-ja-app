// LimpeJaApp/app/auth/components/InputWithIcon.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle, Platform, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// A interface InputWithIconProps agora estende TextInputProps.
interface InputWithIconProps extends TextInputProps { // <-- AQUI ESTÁ A MUDANÇA PRINCIPAL
    iconName: keyof typeof Ionicons.glyphMap;
    // O 'placeholder', 'value', 'onChangeText', 'keyboardType', 'maxLength',
    // 'secureTextEntry', 'textAlign' já vêm de TextInputProps.

    // NOVO: Propriedade para o estilo do View wrapper externo
    wrapperStyle?: ViewStyle; // Tipo para estilos de View
    // A prop 'style' herdada de TextInputProps será usada para o TextInput interno.

    // Props específicas do seu InputWithIcon:
    onPressEye?: () => void;
    showEyeIcon?: boolean;
}

export const InputWithIcon: React.FC<InputWithIconProps> = ({
    iconName,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    maxLength,
    secureTextEntry = false,
    textAlign = 'left',
    // Removi `style` daqui para evitar o conflito de tipo. Ele será passado via `...rest`
    wrapperStyle, // Novo prop para o estilo do wrapper
    onPressEye,
    showEyeIcon,
    ...rest // Captura todas as outras props (incluindo `style` do TextInputProps)
}) => {
    return (
        // Aplica estilos internos (internalStyles.inputWrapper) e depois o novo wrapperStyle
        <View style={[internalStyles.inputWrapper, wrapperStyle]}>
            <View style={internalStyles.iconCircle}>
                <Ionicons name={iconName} size={18} color="#00BCD4" />
            </View>
            <TextInput
                // Aplica estilos internos (internalStyles.input) e depois todas as props capturadas em `...rest`
                // que incluem o `style` original (TextStyle) do `TextInputProps`.
                style={[internalStyles.input, { textAlign }]}
                placeholder={placeholder}
                placeholderTextColor="#A0AEC0"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                maxLength={maxLength}
                secureTextEntry={secureTextEntry}
                textAlign={textAlign}
                {...rest} // <-- PASSA TODAS AS PROPS RESTANTES (incluindo style de TextInputProps) PARA O TEXTINPUT
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
        backgroundColor: Platform.OS === 'android' ? '#85d0fc34' : '#FFFFFF',
        borderRadius: 28,
        height: 48, // ALTURA FINAL
        bottom: 55,
        marginBottom: 10,
        paddingLeft: 5,
        paddingRight: 15,
    },
    iconCircle: {
        width: 40,
        height: 30,
        right: 2,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Platform.OS === 'android' ? '#85d0fc10' : '#FFFFFF',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        height: 40,        // ← COMO FUNCIONA EM TODOS
        paddingVertical: 0,
    },

    eyeIconTouchable: {
        paddingHorizontal: 1,
        height: '100%',
        justifyContent: 'center',
    },
});
