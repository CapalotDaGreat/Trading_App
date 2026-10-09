import { Image } from 'react-native';

import { BRAND } from '@/shared/constants/brand';

const APP_ICON = require('../../../assets/images/icon.png');

type BrandMarkProps = {
  size?: number;
};

/** The TradeAcademy app icon, with iOS-style corner rounding. Opaque tile, so it works on light and dark backgrounds. */
export function BrandMark({ size = 44 }: BrandMarkProps) {
  return (
    <Image
      source={APP_ICON}
      accessibilityRole="image"
      accessibilityLabel={`${BRAND.product} logo`}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
      resizeMode="cover"
      testID="brand-mark"
    />
  );
}
