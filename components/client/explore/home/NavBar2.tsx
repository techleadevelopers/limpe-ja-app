// NavBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Definindo tipos mais específicos para os itens da barra de navegação
interface NavItemBase {
    name: string;
    path: string;
    isCentral?: boolean;
    notificationCount?: number;
}

interface IoniconNavItem extends NavItemBase {
    iconSet: 'Ionicons';
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
}

interface MaterialCommunityIconNavItem extends NavItemBase {
    iconSet: 'MaterialCommunityIcons';
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    activeIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ImageNavItem extends NavItemBase {
    iconSet: 'Image';
    imageSource: any;
}

type NavItemType = IoniconNavItem | MaterialCommunityIconNavItem | ImageNavItem;

const navItems: NavItemType[] = [
    {
        name: 'Home',
        iconSet: 'Ionicons',
        icon: 'sunny-outline',
        activeIcon: 'home',
        path: '/(client)/today',
    },
    {
        name: 'Search',
        iconSet: 'Ionicons',
        icon: 'search-outline',
        activeIcon: 'search',
        path: '/(client)/search',
    },
    {
        name: '',
        iconSet: 'Image',
        imageSource: require('../../../../assets/images/safe.png'),
        isCentral: true,
        path: '/(client)/bookings/schedule-service',
    },
    {
        name: 'Calendar',
        iconSet: 'Ionicons',
        icon: 'calendar-outline',
        activeIcon: 'calendar',
        path: '/(client)/bookings',
    },
    {
        name: 'Inbox',
        iconSet: 'Ionicons',
        icon: 'mail-outline',
        activeIcon: 'mail',
        // CORRIGIDO AQUI: Aponta para a lista de mensagens (index.tsx)
        path: '/(client)/messages',
    },
];

interface NavBarProps {
    unreadMessagesCount?: number;
}

// COPIADO DO HeaderSuperior.tsx: Cores do gradiente
const HERO_GRADIENT_START = 'rgba(45, 108, 233, 0.7)';
const HERO_GRADIENT_MIDDLE = 'rgba(73, 127, 236, 0.9)';
const HERO_GRADIENT_END = 'rgba(45, 101, 232, 0.9)';

const NavBar: React.FC<NavBarProps> = ({ unreadMessagesCount }) => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    const isRouteActive = (itemPath: string) => {
        if (itemPath === '/(client)/today' && pathname === '/') {
            return true;
        }
        // A rota do inbox agora é '/(client)/messages'.
        // Se o pathname começar com '/(client)/messages', incluindo '/(client)/messages/[chatId]',
        // o ícone do Inbox deve estar ativo.
        if (itemPath === '/(client)/messages' && pathname.startsWith('/(client)/messages')) {
            return true;
        }
        return pathname.startsWith(itemPath);
    };

    const leftNavItems = navItems.slice(0, 2);
    const rightNavItems = navItems.slice(3);

    const renderNavItem = (item: NavItemType) => {
        const isActive = isRouteActive(item.path);
        const iconColor = isActive ? '#ffffffff' : '#ffffffff';
        const textColor = isActive ? '#ffffffff' : '#ffffffff';

        if (item.iconSet === 'Ionicons') {
            const ioniconItem = item as IoniconNavItem;
            return (
                <TouchableOpacity
                    key={ioniconItem.path}
                    style={styles.navItem}
                    onPress={() => router.push(ioniconItem.path as any)}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name={isActive ? ioniconItem.activeIcon : ioniconItem.icon} size={17} color={iconColor} />
                        {ioniconItem.name === 'Inbox' && unreadMessagesCount && unreadMessagesCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationText}>{unreadMessagesCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.navText, { color: textColor }]}>{ioniconItem.name}</Text>
                </TouchableOpacity>
            );
        } else if (item.iconSet === 'MaterialCommunityIcons') {
            const mcIconItem = item as MaterialCommunityIconNavItem;
            return (
                <TouchableOpacity
                    key={mcIconItem.path}
                    style={styles.navItem}
                    onPress={() => router.push(mcIconItem.path as any)}
                >
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name={mcIconItem.icon} size={24} color={iconColor} />
                        {mcIconItem.name === 'Inbox' && unreadMessagesCount && unreadMessagesCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationText}>{unreadMessagesCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.navText, { color: textColor }]}>{mcIconItem.name}</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    return (
        <View style={[styles.navBarWrapper, { paddingBottom: insets.bottom }]}>
            <LinearGradient
                // CORES E DIREÇÃO DO GRADIENTE COPIADAS DO HeaderSuperior.tsx
                colors={[HERO_GRADIENT_START, HERO_GRADIENT_MIDDLE, HERO_GRADIENT_END]}
                start={{ x: 0.0, y: 0.0 }} // Mesma direção diagonal do HeaderSuperior
                end={{ x: 1.0, y: 1.0 }}   // Mesma direção diagonal do HeaderSuperior
                style={styles.navBar}
            >
                {/* Itens da esquerda */}
                <View style={[styles.navGroup, { marginRight: -20 }]}>
                    {leftNavItems.map(renderNavItem)}
                </View>

                {/* Botão central */}
                <TouchableOpacity
                    key={navItems[2].path}
                    style={styles.centralNavItemContainer}
                    onPress={() => router.push(navItems[2].path as any)}
                >
                    <LinearGradient
                        colors={['#e3eaefff', '#0097FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.centralButtonGradient}
                    >
                        <Ionicons name="add" size={30} color="#FFFFFF" style={styles.centralButtonPlusIcon} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Itens da direita */}
                <View style={[styles.navGroup, { marginLeft: 98 }]}>
                    {rightNavItems.map(renderNavItem)}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    navBarWrapper: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    navBar: {
        flexDirection: 'row',
        height: Platform.OS === 'ios' ? 80 : 40,
        marginHorizontal: 20,
        bottom: 0,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        alignItems: 'center',
        justifyContent: 'space-around', // Mantém o espaçamento geral
        
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    // Novo estilo para os grupos de navegação
    navGroup: {
        flexDirection: 'row',
        flex: 1, // Permite que cada grupo ocupe metade do espaço
        justifyContent: 'space-between', // Espaça os itens dentro de cada grupo
        alignItems: 'center',
        margin: 12,
        paddingHorizontal: 8,
        top: 4,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
    },
    iconContainer: {
        position: 'relative',
        bottom: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navText: {
        fontSize: 8.3,
        fontWeight: '600',
        marginTop: -5,
      
    },
    centralNavItemContainer: {
        position: 'absolute',
        top: -1,
        width: 40,
        height: 40,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 15,
    },
    centralButtonGradient: {
        width: 32,
        height: 32,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centralButtonPlusIcon: {},
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default NavBar;