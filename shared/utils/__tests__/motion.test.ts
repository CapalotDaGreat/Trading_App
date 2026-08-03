import { fadeIn, fadeInDown, fadeOut, layoutTransition } from '../motion';

describe('motion helpers', () => {
  it('returns undefined when reduce motion is enabled', () => {
    expect(fadeInDown(true)).toBeUndefined();
    expect(fadeIn(true)).toBeUndefined();
    expect(fadeOut(true)).toBeUndefined();
    expect(layoutTransition(true)).toBeUndefined();
  });

  it('returns entering animations when motion is allowed', () => {
    expect(fadeInDown(false)).toBeTruthy();
    expect(fadeIn(false, { delay: 40 })).toBeTruthy();
  });
});
