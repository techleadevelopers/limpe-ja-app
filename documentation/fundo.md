// --- TRECHO JSX DO FUNDO ---
// Este trecho deve ser colocado dentro da função render ou do return de um componente React Native.
// Ele assume que `backgroundFloatAnim`, `rotateAnim`, `calendarBreatheAnim` são Animated.Value
// e que `SCREEN_WIDTH`, `SCREEN_HEIGHT`, `AppColors` estão definidos no escopo.

<View style={styles.screenContainer}>
    <Animated.View style={[
        styles.backgroundDecoration,
        {
            transform: [
                {
                    translateY: backgroundFloatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 20]
                    })
                },
                {
                    rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                    })
                }
            ]
        }
    ]}>
        <LinearGradient
            colors={['rgba(66, 165, 245, 0.08)', 'rgba(144, 202, 249, 0.06)']}
            style={styles.decorationGradient}
        />
    </Animated.View>

    <Animated.View style={[
        styles.backgroundDecoration2,
        {
            transform: [
                {
                    translateX: backgroundFloatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, -10]
                    })
                },
                { scale: calendarBreatheAnim }
            ]
        }
    ]}>
        <LinearGradient
            colors={['rgba(121, 134, 203, 0.05)', 'rgba(129, 140, 248, 0.08)']}
            style={styles.decorationGradient}
        />
    </Animated.View>

    {/* Seu conteúdo principal da tela iria aqui, sobrepondo o fundo */}
</View>


// --- TRECHO StyleSheet (CSS-in-JS) ---
// Este objeto StyleSheet deve ser definido no mesmo arquivo ou importado.
// Ele assume que `SCREEN_WIDTH`, `SCREEN_HEIGHT`, `AppColors` estão definidos.

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: AppColors.backgroundLight,
    },
    backgroundDecoration: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.1,
        right: -SCREEN_WIDTH * 0.2,
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
        borderRadius: SCREEN_WIDTH * 0.3,
        overflow: 'hidden',
    },
    backgroundDecoration2: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.3,
        left: -SCREEN_WIDTH * 0.15,
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
        borderRadius: SCREEN_WIDTH * 0.25,
        overflow: 'hidden',
    },
    decorationGradient: {
        flex: 1,
    },
});

// --- DEFINIÇÕES DE CONSTANTES NECESSÁRIAS (se não importadas) ---
// Você precisará ter estas definidas no seu arquivo para que o StyleSheet funcione.
// Exemplo:
/*
import { Dimensions } from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const AppColors = {
    backgroundLight: '#F5F7FA',
    // ... outras cores que você usa nos gradientes
};
*/