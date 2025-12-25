import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { AppColors, AppShadows } from '../../../../../constants/appStyles';

interface ServiceDetailsDto {
  id: string;
  name: string;
  icon?: any;
}

interface CategoryCardProps {
  item: ServiceDetailsDto;
}

type QuickAccessItem = {
  id: string;
  label: string;
  icon: any;
};

const QUICK_ACCESS: QuickAccessItem[] = [
  { id: 'obras', label: 'Obras', icon: require('../../../../assets/images/icons/obra.png') },
  { id: 'casa', label: 'Casa', icon: require('../../../../assets/images/icons/residencial.png') },
  { id: 'empresa', label: 'Empresa', icon: require('../../../../assets/images/icons/comercial.png') },
  { id: 'vidros', label: 'Vidros', icon: require('../../../../assets/images/icons/vidro.png') },
  { id: 'escritorio', label: 'Escritorio', icon: require('../../../../assets/images/icons/escritorio.png') },
  { id: 'estofados', label: 'Estofados', icon: require('../../../../assets/images/icons/estofados.png') },
];

const ITEM_WIDTH = 90;
const CategoryCard2: React.FC<CategoryCardProps> = ({ item }) => {
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') return null;

  const flatRef = useRef<FlatList>(null);
  const middleIndex = 1; // garante "Casa" no centro
  const [activeIndex, setActiveIndex] = useState(middleIndex);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems?.length > 0 && typeof viewableItems[0].index === 'number') {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const scrollLeft = () => {
    if (activeIndex > 0) {
      flatRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
    }
  };

  const scrollRight = () => {
    if (activeIndex < QUICK_ACCESS.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  return (
    <View style={styles.howItWorksTutorialContainer}>
      <Text style={styles.howItWorksTitle} allowFontScaling={false}>
        Categorias
      </Text>

      <View style={styles.carouselWrapper}>
        <FlatList
          ref={flatRef}
          data={QUICK_ACCESS}
          keyExtractor={(it) => it.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          initialScrollIndex={middleIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 55 }}
          contentContainerStyle={styles.listWrapper}
          renderItem={({ item: it, index }) => {
            const isActive = index === activeIndex;
            const iconSize = isActive ? 44 : 36;

            return (
              <Animated.View
                style={[
                  styles.howItWorksStep,
                  {
                    transform: [{ scale: isActive ? 1 : 0.9 }],
                    opacity: isActive ? 1 : 0.55,
                  },
                ]}
              >
                <Image source={it.icon} style={[styles.howItWorksIcon, { width: iconSize, height: iconSize }]} />
                <Text
                  style={[
                    styles.howItWorksStepLabel,
                    isActive && styles.howItWorksStepLabelActive,
                  ]}
                  allowFontScaling={false}
                >
                  {it.label}
                </Text>
              </Animated.View>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  howItWorksTutorialContainer: {
    marginHorizontal: 11,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 29,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 0,
    
  },
  howItWorksTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '700',
    color: AppColors.textTitle,
    marginBottom: 14,
    textAlign: 'center',
  },
  carouselWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  listWrapper: {
    paddingHorizontal: 6,
  },
 howItWorksStep: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 4,
    right: -18,
    justifyContent: 'center',
  },
  howItWorksIcon: {
    marginBottom: 3,
    resizeMode: 'contain',
  },
  howItWorksStepLabel: {
    fontSize: 12,
    color: AppColors.textBody,
  },
  howItWorksStepLabelActive: {
    fontWeight: '700',
    color: AppColors.textTitle,
  },
  arrow: {
    position: 'absolute',
    top: '22%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(64,149,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  arrowLeft: {
  },
  arrowRight: {
  },
  arrowText: {
    color: '#378AFF',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default CategoryCard2;
