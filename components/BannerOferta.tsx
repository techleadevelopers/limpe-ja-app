// LimpeJaApp/components/BannerOferta.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const BannerOferta: React.FC = () => {
  const router = useRouter();

  // --- FUNÇÃO MODIFICADA PARA TESTE ---
  const handleBannerPress = () => {
    // const ofertaId = 'primeiraLimpeza30off'; // Comentado para o teste
    console.log("BannerOferta: Tentando navegar para / (auth)/login (TESTE)");
    router.push('/(auth)/login'); // Usando uma rota simples e existente para o teste
  };
  // --- FIM DA MODIFICAÇÃO PARA TESTE ---

  return (
    <TouchableOpacity style={styles.bannerOferta} onPress={handleBannerPress}>
      <Image
        source={{ uri: 'https://via.placeholder.com/400x170/87CEEB/1E3A5F?text=Oferta+Imperd%C3%ADvel!' }}
        style={styles.bannerImagem}
        resizeMode="cover"
      />
      <View style={styles.bannerConteudo}>
        <Text style={styles.bannerTextoPrincipal}>OFERTA EXCLUSIVA</Text>
        <Text style={styles.bannerTextoSecundario}>30% OFF na primeira limpeza</Text>
        <TouchableOpacity style={styles.bannerBotaoAproveitar} onPress={handleBannerPress}>
          <Text style={styles.bannerBotaoTexto}>Aproveitar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerOferta: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 20,
    overflow: 'hidden',
    height: 170,
    position: 'relative',
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerImagem: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerConteudo: {
    flex: 1,
    padding: 22,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 60, 120, 0.45)',
  },
  bannerTextoPrincipal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerTextoSecundario: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 30,
  },
  bannerBotaoAproveitar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  bannerBotaoTexto: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default BannerOferta;