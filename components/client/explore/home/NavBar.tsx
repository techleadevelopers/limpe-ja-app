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
        path: '/(client)/inbox',
    },
];

interface NavBarProps {
    unreadMessagesCount?: number;
}

const NavBar: React.FC<NavBarProps> = ({ unreadMessagesCount }) => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    const isRouteActive = (itemPath: string) => {
        if (itemPath === '/(client)/today' && pathname === '/') {
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
                        <Ionicons name={isActive ? ioniconItem.activeIcon : ioniconItem.icon} size={22} color={iconColor} />
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
                colors={['#7694f6ff', '#67adfdff', '#5c93ecff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    navBar: {
        flexDirection: 'row',
        height: Platform.OS === 'ios' ? 80 : 55,
        marginHorizontal: 20,
        bottom: 5,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    navText: {
        fontSize: 9.3,
        fontWeight: '600',
        marginTop: 4,
      
    },
    centralNavItemContainer: {
        position: 'absolute',
        top: -8,
        width: 60,
        height: 60,
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
        width: 50,
        height: 50,
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