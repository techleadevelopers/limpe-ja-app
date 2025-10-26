import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BubblesRN from '../../../../components/BubblesRN'; // ✅ import do componente de bolhas

interface NewHeaderProps {
  userName: string;
  userAvatarUrl?: string | null;
  userAddress?: string | null;
}

const NewHeader: React.FC<NewHeaderProps> = ({ userName, userAvatarUrl, userAddress }) => {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleProfilePress = () => {
    router.push('/(client)/profile' as any);
  };

  const handleCategoryPress = () => {
    router.push('/(client)/explore/menu' as any);
  };

  const avatarSource = userAvatarUrl
    ? { uri: userAvatarUrl }
    : require('../../../../assets/images/default-avatar.png');

  return (
    <LinearGradient
      colors={['#4d8ce415', '#4d8ce415']}
      style={styles.container}
    >
      {/* ✅ Bubbles por baixo de tudo */}
      <BubblesRN
        countMin={45}
        countMax={68}
        bubbleMin={5}
        bubbleMax={14}
        bubbleColor="rgba(29, 118, 242, 0.2)"
        bubbleBorderColor="rgba(29,93,242,0.22)"
        bubbleBorderWidth={0}
        style={{ ...StyleSheet.absoluteFillObject, zIndex: -1 }}
      />

      <View style={styles.leftContent}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileImageContainer}>
          <Image source={avatarSource} style={styles.profileImage} />
        </TouchableOpacity>
        <View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <TouchableOpacity onPress={handleCategoryPress} style={styles.notificationIconContainer}>
          <Image
            source={require('../../../../assets/images/3d/category2.png')}
            style={styles.categoryIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Constants.statusBarHeight - 35,
    left: 0,
    top: 2,
    marginHorizontal: 11,
    paddingHorizontal: 15,
    borderBottomEndRadius: 40,
    borderBottomStartRadius: 40,
    borderTopEndRadius: 40,
    borderTopStartRadius: 40,
    marginBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 0,
    shadowColor: '#2f3344e8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.17,
    shadowRadius: 9,
    elevation: 6,
    overflow: 'hidden', // garante que as bolhas não escapem
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 38,
    height: 38,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  greetingText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Montserrat-ExtraBold',
      android: 'Montserrat-Regular'
    }),
    color: '#666',
    fontWeight: Platform.select({
      ios: '300',
      android: '900'
    }),
  },
  userNameText: {
    fontSize: 19,
    fontFamily: Platform.select({
      ios: 'Montserrat-ExtraBold',
      android: 'Montserrat-Thin'
    }),
    color: '#7398b9ff',
    fontWeight: Platform.select({
      ios: '300',
      android: 'bold'
    }),
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    padding: 5,
  },
  categoryIcon: {
    width: 25,
    height: 25,
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
