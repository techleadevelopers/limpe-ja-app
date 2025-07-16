
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      title: 'Bem-vindo ao LimpeJá',
      subtitle: 'Conectando você aos melhores profissionais de limpeza',
      image: require('../assets/images/logo.png'),
      backgroundColor: '#4F46E5'
    },
    {
      title: 'Serviços de Qualidade',
      subtitle: 'Profissionais verificados e avaliados pelos clientes',
      image: require('../assets/images/safe.png'),
      backgroundColor: '#059669'
    },
    {
      title: 'Agendamento Fácil',
      subtitle: 'Agende seus serviços com apenas alguns toques',
      image: require('../assets/images/central-icon.png'),
      backgroundColor: '#DC2626'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('welcomeViewed', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erro ao salvar status do welcome:', error);
      router.replace('/(auth)/login');
    }
  };

  const currentScreenData = screens[currentScreen];

  return (
    <View style={[styles.container, { backgroundColor: currentScreenData.backgroundColor }]}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={currentScreenData.image} style={styles.image} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentScreenData.title}</Text>
          <Text style={styles.subtitle}>{currentScreenData.subtitle}</Text>
        </View>
        
        <View style={styles.pagination}>
          {screens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentScreen ? '#ffffff' : 'rgba(255, 255, 255, 0.5)' }
              ]}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Começar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
});
