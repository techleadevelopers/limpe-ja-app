import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants'; // Importa Constants para acessar a altura da barra de status
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Platform } from 'react-native'; // Importe Platform
import { LinearGradient } from 'expo-linear-gradient'; // Importação do LinearGradient
import { Icons3D } from '@/constants/icons3d';

interface NewHeaderProps {
    userName: string;
    userAvatarUrl?: string | null; // Propriedade opcional para o avatar do usuário, aceitando string, undefined ou null
    userAddress?: string | null; // Adicione esta linha
}

const NewHeader: React.FC<NewHeaderProps> = ({ userName, userAvatarUrl }) => {
    const router = useRouter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        // Alteração: Capitalização corrigida para as saudações em português
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const handleProfilePress = () => {
        router.push('/(client)/profile' as any); // Ajuste a rota se necessário
    };

    const handleNotificationsPress = () => {
        // Implemente a lógica de notificação aqui, por exemplo, navegar para uma tela de notificações
        console.log("Notifications pressed");
        // router.push('/(client)/notifications' as any); // Exemplo de navegação
    };

    // Define a fonte da imagem do avatar. Se userAvatarUrl for nulo ou indefinido, usa o avatar padrão.
    const avatarSource = userAvatarUrl
        ? { uri: userAvatarUrl }
        : require('../../../../assets/images/default-avatar.png');

    return (
        <LinearGradient
            colors={['#a6abb213', '#a6abb213']} // Cores do gradiente, do lilás ao rosa suave
            style={styles.container}
        >
            <View style={styles.leftContent}>
                <TouchableOpacity onPress={handleProfilePress} style={styles.profileImageContainer}>
                    <Image source={require('../../../../assets/images/default-avatar.png')} style={styles.profileImage} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <Text style={styles.userNameText}>{userName}</Text>
                </View>
            </View>
            <View style={styles.rightContent}>
                <TouchableOpacity onPress={handleNotificationsPress} style={styles.notificationIconContainer}>
                    {/* Alteração aqui: Substituindo Ionicons por Image */}
                    <Image
                        source={require('../../../../assets/images/3d/category2.png')}
                        style={styles.categoryIcon} // Novo estilo para o ícone da categoria
                        resizeMode="contain" // Garante que a imagem se ajuste sem cortar
                    />
                    {/* Opcional: Badge de notificação (descomente e implemente a lógica se precisar) */}
                    {/* <View style={styles.notificationBadge} /> */}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        // paddingTop ajustado para considerar a altura da barra de status do dispositivo
        // Reduzido o 40 para 30 para um cabeçalho um pouco menos alto
        paddingVertical: Constants.statusBarHeight + 20, 
        left: 5,
        paddingHorizontal: 15,
        // REMOVIDO: Borda arredondada do cabeçalho
        borderBottomEndRadius: 30,
        borderBottomStartRadius: 30,
        borderRadius: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 9,
        marginBottom: 13,
        // Adicionando zIndex para garantir que o cabeçalho fique abaixo do conteúdo principal
        zIndex: 0, // Definindo um zIndex explícito e baixo
        shadowColor: '#2f3344e8', // Cor da sombra
        shadowOffset: { width: 0, height: 1 }, // Deslocamento vertical mais pronunciado
        shadowOpacity: 0.17, // Opacidade aumentada para robustezs
        shadowRadius: 9, // Raio de desfoque para conforto
        elevation: 6, // Elevação aumentada para robustez no Android

     
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageContainer: {
        width: 37,
        height: 37,
        borderRadius: 20,
        overflow: 'hidden', // Garante que a imagem não saia dos limites do borderRadius
        marginRight: 6,
        backgroundColor: 'transparent', // Fundo de placeholder enquanto a imagem carrega ou se não houver avatar
        justifyContent: 'center',
        alignItems: 'center',

    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', // Garante que a imagem cubra todo o espaço
    },
    greetingText: {
        fontSize: 11,
        fontFamily: 'Montserrat-Regular',
        color: '#666',
        fontWeight: '800',
    },
    userNameText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Thin',
        color: '#333',
        fontWeight: 'bold',
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        
    },
    notificationIconContainer: {
        padding: 5,
    },
    // NOVO ESTILO PARA O ÍCONE DA CATEGORIA
    categoryIcon: {
        width: 24, // Ajuste o tamanho conforme necessário para o ícone da categoria
        height: 24,
        
    },
    notificationBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'red',
        borderRadius: 5,
        width: 10,
        height: 10,
    },
});

export default NewHeader;