import { toMajor, toMinor, weightedAveragePriceMajor, grossValueMinor } from '../simulation-money.service';

describe('simulation money', () => {
  it('rounds majors through integer cents', () => {
    expect(toMinor(100.005)).toBe(10001);
    expect(toMajor(10001)).toBe(100.01);
    expect(toMinor(0.1) + toMinor(0.2)).toBe(toMinor(0.3));
  });

  it('computes gross value without float drift', () => {
    expect(grossValueMinor(10, 90.1)).toBe(90100);
    expect(toMajor(grossValueMinor(10, 90.1))).toBe(901);
  });

  it('weights average entry in minor units', () => {
    expect(weightedAveragePriceMajor(10, 100, 10, 120)).toBe(110);
    expect(weightedAveragePriceMajor(3, 90.1, 1, 90.2)).toBe(90.13);
  });
});
