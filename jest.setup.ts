jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Firebase JS SDK pulls ESM-only helpers that Jest cannot parse without custom transforms.
jest.mock('firebase/app', () => ({
  FirebaseError: class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn(async () => ({ data: {} }))),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Reanimated 4 / Worklets 0.10 load native unpackers that Jest cannot provide.
// Do not use react-native-reanimated/mock — it still pulls NativeWorklets in 4.5.x.
jest.mock('react-native-worklets', () => ({
  createSerializable: (value: unknown) => value,
  isWorkletFunction: () => false,
  getWorkletRuntime: () => null,
  createWorkletRuntime: () => ({}),
  runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  executeOnUIRuntimeSync: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image, ScrollView, FlatList } = require('react-native');
  const NOOP = () => undefined;
  const identity = <T,>(value: T) => value;
  const animatedComponent = (Component: unknown) => Component ?? View;

  const createAnimChain = () => {
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.springify = self;
    chain.duration = self;
    chain.delay = self;
    chain.damping = self;
    chain.stiffness = self;
    chain.mass = self;
    chain.withInitialValues = self;
    chain.build = () => ({});
    return chain;
  };

  return {
    __esModule: true,
    default: {
      call: NOOP,
      createAnimatedComponent: animatedComponent,
      View,
      Text,
      Image,
      ScrollView,
      FlatList,
    },
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    createAnimatedComponent: animatedComponent,
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useAnimatedRef: () => ({ current: null }),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    useAnimatedScrollHandler: () => NOOP,
    useAnimatedReaction: NOOP,
    withTiming: identity,
    withSpring: identity,
    withDelay: (_delay: number, animation: unknown) => animation,
    withSequence: identity,
    withRepeat: identity,
    cancelAnimation: NOOP,
    runOnJS: identity,
    runOnUI: identity,
    Easing: {
      linear: identity,
      ease: identity,
      quad: identity,
      cubic: identity,
      poly: () => identity,
      sin: identity,
      circle: identity,
      exp: identity,
      elastic: () => identity,
      back: () => identity,
      bounce: identity,
      bezier: () => identity,
      in: identity,
      out: identity,
      inOut: identity,
    },
    FadeIn: createAnimChain(),
    FadeOut: createAnimChain(),
    FadeInDown: createAnimChain(),
    FadeInUp: createAnimChain(),
    Layout: createAnimChain(),
    SlideInDown: createAnimChain(),
    SlideOutDown: createAnimChain(),
    ZoomIn: createAnimChain(),
    ZoomOut: createAnimChain(),
    interpolate: NOOP,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    ...{ React },
  };
});

global.IS_REACT_ACT_ENVIRONMENT = true;
