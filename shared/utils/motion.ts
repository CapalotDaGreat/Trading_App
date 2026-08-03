import { FadeIn, FadeInDown, FadeInUp, FadeOut, Layout } from 'react-native-reanimated';

type Delayable = { delay?: number; duration?: number };

/**
 * Motion helpers that collapse to undefined when Reduce Motion is on.
 * Keep all feature enter animations on these helpers for WCAG-friendly polish.
 */
export function fadeInDown(reduceMotion: boolean, options: Delayable = {}) {
  if (reduceMotion) return undefined;
  const entering = FadeInDown.springify();
  if (options.delay != null) return entering.delay(options.delay);
  return entering;
}

export function fadeInUp(reduceMotion: boolean, options: Delayable = {}) {
  if (reduceMotion) return undefined;
  const entering = FadeInUp.springify();
  if (options.delay != null) return entering.delay(options.delay);
  return entering;
}

export function fadeIn(reduceMotion: boolean, options: Delayable = {}) {
  if (reduceMotion) return undefined;
  let entering = FadeIn.duration(options.duration ?? 220);
  if (options.delay != null) entering = entering.delay(options.delay);
  return entering;
}

export function fadeOut(reduceMotion: boolean) {
  if (reduceMotion) return undefined;
  return FadeOut.duration(160);
}

export function layoutTransition(reduceMotion: boolean) {
  if (reduceMotion) return undefined;
  return Layout.springify().damping(18);
}
