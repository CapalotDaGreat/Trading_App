import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { subscriptionService } from '@/features/subscription/services/subscription.service';

export type AdPlacement = 'banner' | 'native' | 'rewarded';
export type AdNetwork = 'expo_upsell' | 'admob' | 'none';

export interface AdConfig {
  placement: AdPlacement;
  unitId?: string;
  testMode?: boolean;
}

export interface AdLoadResult {
  loaded: boolean;
  network: AdNetwork;
  showUpsell: boolean;
  message?: string;
}

export interface RewardedAdResult {
  rewarded: boolean;
  network: AdNetwork;
  message: string;
}

export interface AdMobAdapter {
  isAvailable(): boolean;
  loadBanner(config: AdConfig): Promise<AdLoadResult>;
  loadNative(config: AdConfig): Promise<AdLoadResult>;
  showRewarded(config: AdConfig): Promise<RewardedAdResult>;
}

export interface AdsService {
  getNetwork(): AdNetwork;
  shouldShowAds(uid?: string | null): Promise<boolean>;
  loadBanner(config?: Partial<AdConfig>): Promise<AdLoadResult>;
  loadNative(config?: Partial<AdConfig>): Promise<AdLoadResult>;
  showRewarded(config?: Partial<AdConfig>): Promise<RewardedAdResult>;
  registerAdMobAdapter(adapter: AdMobAdapter): void;
}

const ADMOB_UNIT_IDS = {
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? 'ca-app-pub-3940256099942544/6300978111',
  native: process.env.EXPO_PUBLIC_ADMOB_NATIVE_ID ?? 'ca-app-pub-3940256099942544/2247696110',
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? 'ca-app-pub-3940256099942544/5224354917',
};

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function isProductionBuild(): boolean {
  return !isExpoGo() && Platform.OS !== 'web';
}

class ExpoUpsellAdapter implements AdMobAdapter {
  isAvailable(): boolean {
    return isExpoGo();
  }

  async loadBanner(): Promise<AdLoadResult> {
    return {
      loaded: true,
      network: 'expo_upsell',
      showUpsell: true,
      message: 'Upgrade to Premium for an ad-free experience.',
    };
  }

  async loadNative(): Promise<AdLoadResult> {
    return {
      loaded: true,
      network: 'expo_upsell',
      showUpsell: true,
      message: 'Remove ads and unlock AI insights with Premium.',
    };
  }

  async showRewarded(): Promise<RewardedAdResult> {
    return {
      rewarded: false,
      network: 'expo_upsell',
      message: 'Rewarded ads are available in production builds. Upgrade to Premium in Expo Go.',
    };
  }
}

class ProductionAdMobStub implements AdMobAdapter {
  isAvailable(): boolean {
    return isProductionBuild();
  }

  async loadBanner(config: AdConfig): Promise<AdLoadResult> {
    return {
      loaded: false,
      network: 'admob',
      showUpsell: false,
      message: `AdMob banner ready for unit ${config.unitId ?? ADMOB_UNIT_IDS.banner}. Install react-native-google-mobile-ads in production.`,
    };
  }

  async loadNative(config: AdConfig): Promise<AdLoadResult> {
    return {
      loaded: false,
      network: 'admob',
      showUpsell: false,
      message: `AdMob native ready for unit ${config.unitId ?? ADMOB_UNIT_IDS.native}.`,
    };
  }

  async showRewarded(config: AdConfig): Promise<RewardedAdResult> {
    return {
      rewarded: false,
      network: 'admob',
      message: `AdMob rewarded ready for unit ${config.unitId ?? ADMOB_UNIT_IDS.rewarded}.`,
    };
  }
}

class AdsServiceImpl implements AdsService {
  private customAdapter: AdMobAdapter | null = null;

  registerAdMobAdapter(adapter: AdMobAdapter): void {
    this.customAdapter = adapter;
  }

  private getAdapter(): AdMobAdapter {
    if (this.customAdapter?.isAvailable()) {
      return this.customAdapter;
    }
    if (isExpoGo()) {
      return new ExpoUpsellAdapter();
    }
    return new ProductionAdMobStub();
  }

  getNetwork(): AdNetwork {
    if (isExpoGo()) return 'expo_upsell';
    if (isProductionBuild()) return 'admob';
    return 'none';
  }

  async shouldShowAds(uid?: string | null): Promise<boolean> {
    if (!uid) return true;
    try {
      const isPremium = await subscriptionService.checkPremiumStatus(uid);
      return !isPremium;
    } catch {
      return true;
    }
  }

  async loadBanner(config: Partial<AdConfig> = {}): Promise<AdLoadResult> {
    const adapter = this.getAdapter();
    return adapter.loadBanner({
      placement: 'banner',
      unitId: ADMOB_UNIT_IDS.banner,
      testMode: __DEV__,
      ...config,
    });
  }

  async loadNative(config: Partial<AdConfig> = {}): Promise<AdLoadResult> {
    const adapter = this.getAdapter();
    return adapter.loadNative({
      placement: 'native',
      unitId: ADMOB_UNIT_IDS.native,
      testMode: __DEV__,
      ...config,
    });
  }

  async showRewarded(config: Partial<AdConfig> = {}): Promise<RewardedAdResult> {
    const adapter = this.getAdapter();
    return adapter.showRewarded({
      placement: 'rewarded',
      unitId: ADMOB_UNIT_IDS.rewarded,
      testMode: __DEV__,
      ...config,
    });
  }
}

export const adsService: AdsService = new AdsServiceImpl();

export { ADMOB_UNIT_IDS };
