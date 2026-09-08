import { buildEducationalChart } from '../educational-chart.service';

describe('educational chart scenes', () => {
  it('builds labelled synthetic candles, never an empty live series', () => {
    const model = buildEducationalChart('candles');
    expect(model.candles.length).toBeGreaterThan(8);
    expect(model.spokenSummary.toLowerCase()).toContain('not live');
    expect(model.annotations.length).toBeGreaterThan(0);
  });

  it('includes an oscillator panel for RSI scenes', () => {
    const model = buildEducationalChart('rsi');
    expect(model.oscillator?.label).toMatch(/RSI/);
    expect(model.oscillator?.bands.some((band) => band.value === 70)).toBe(true);
  });

  it('shows volume for participation scenes', () => {
    const volume = buildEducationalChart('volume');
    expect(volume.showVolume).toBe(true);
    expect(Math.max(...volume.candles.map((item) => item.volume))).toBeGreaterThan(2_000);
  });

  it('includes an oscillator panel for MACD scenes and a visual R:R scene', () => {
    const macd = buildEducationalChart('macd');
    expect(macd.oscillator?.label.toLowerCase()).toMatch(/macd/);
    const rr = buildEducationalChart('risk_reward');
    expect(
      rr.annotations.some((item) => {
        const text = 'label' in item ? item.label : item.text;
        return /entry|stop|target/i.test(text);
      }),
    ).toBe(true);
  });
});
