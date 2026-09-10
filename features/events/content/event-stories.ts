import type { CuratedMarketStory } from '../types/events.types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Always-available educational stories. Labelled sample.
 * These are not a news wire and do not replace a failed vendor calendar.
 */
export function listCuratedMarketStories(now = Date.now()): CuratedMarketStory[] {
  return [
    {
      id: 'story-fomc-2022-03',
      title: 'Historical: March 2022 FOMC lift-off',
      kind: 'interest_rate',
      lifecycle: 'historical',
      scheduledAt: Date.parse('2022-03-16T18:00:00.000Z'),
      whatHappenedOrExpected:
        'The Federal Reserve raised the target range and published a statement. This card is a study object, not a claim about the next meeting.',
      whyMarketsMayCare:
        'Lift-off years are a classroom for expectations versus the path of rates. Later meetings did not have to rhyme.',
      relatedAssets: ['Duration', 'Growth equities', 'USD'],
      relatedSectors: ['Technology', 'Financials', 'Housing'],
      country: 'United States',
      countryCode: 'US',
      historicalRelevance: 0.92,
      marketScope: 0.9,
      volatilityPotential: 0.75,
      articles: [
        {
          headline: 'FOMC statement — March 16, 2022',
          source: 'Board of Governors of the Federal Reserve System',
          date: '16 Mar 2022',
          summary: 'Official statement and implementation note. We link; we do not reprint the statement.',
          whyItMatters: 'Primary text beats a recap. Replay teaches process, not a repeatable trade.',
          url: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20220316a.htm',
        },
      ],
    },
    {
      id: 'story-cpi-2022-06',
      title: 'Historical: June 2022 CPI print',
      kind: 'inflation',
      lifecycle: 'historical',
      scheduledAt: Date.parse('2022-06-10T12:30:00.000Z'),
      whatHappenedOrExpected:
        'BLS published the May 2022 CPI. The print is public history. It does not tell you what the next CPI will be.',
      whyMarketsMayCare:
        'A hot inflation year is a classroom for real yields, policy odds, and why the first tick is not the thesis.',
      relatedAssets: ['Nominal bonds', 'Growth equities', 'USD'],
      relatedSectors: ['Technology', 'Consumer', 'Utilities'],
      country: 'United States',
      countryCode: 'US',
      historicalRelevance: 0.88,
      marketScope: 0.86,
      volatilityPotential: 0.8,
      articles: [
        {
          headline: 'Consumer Price Index — archived release pages',
          source: 'U.S. Bureau of Labor Statistics',
          date: '10 Jun 2022',
          summary: 'Official CPI release archives. Link only — we do not copy tables.',
          whyItMatters: 'Know what the index measures before treating a 2022 tape as a template.',
          url: 'https://www.bls.gov/cpi/',
        },
      ],
    },
    {
      id: 'story-brexit-2016',
      title: 'Historical: June 2016 UK referendum night',
      kind: 'geopolitical',
      lifecycle: 'historical',
      scheduledAt: Date.parse('2016-06-23T21:00:00.000Z'),
      whatHappenedOrExpected:
        'The United Kingdom voted on EU membership. FX and risk assets moved as results arrived. History, not a forecast.',
      whyMarketsMayCare:
        'A binary political night is a classroom for incomplete information, FX gaps, and waiting.',
      relatedAssets: ['GBP crosses', 'European equities', 'USD'],
      relatedSectors: ['Banks', 'Exporters', 'Broad European index'],
      country: 'United Kingdom',
      countryCode: 'GB',
      historicalRelevance: 0.84,
      marketScope: 0.78,
      volatilityPotential: 0.86,
      articles: [
        {
          headline: 'EU referendum result',
          source: 'The Electoral Commission',
          date: '23 Jun 2016',
          summary: 'Official referendum result pages.',
          whyItMatters: 'The count is the event. Market color is commentary.',
          url: 'https://www.electoralcommission.org.uk/research-reports-and-data/our-reports-and-data-past-elections-and-referendums/eu-referendum',
        },
      ],
    },
    {
      id: 'story-developing-shipping',
      title: 'Developing: shipping and energy attention',
      kind: 'geopolitical',
      lifecycle: 'developing',
      scheduledAt: now - 8 * 60 * 60 * 1000,
      whatHappenedOrExpected:
        'Official briefings periodically mention maritime security and energy routes. Details change. This card tracks the category, not a live feed.',
      whyMarketsMayCare:
        'Energy, freight, and risk appetite can move together when a route is in doubt. First takes are incomplete.',
      relatedAssets: ['Energy (educational)', 'Freight-sensitive names', 'USD'],
      relatedSectors: ['Energy', 'Industrials', 'Insurance'],
      historicalRelevance: 0.55,
      marketScope: 0.7,
      volatilityPotential: 0.62,
      articles: [
        {
          headline: 'U.S. Department of State — press releases',
          source: 'U.S. Department of State',
          date: 'Ongoing',
          summary: 'Primary-source diplomatic notices. We do not scrape or rewrite classified detail.',
          whyItMatters: 'Use official text. Do not treat a social summary as the event.',
          url: 'https://www.state.gov/press-releases/',
        },
      ],
    },
    {
      id: 'story-developing-sec',
      title: 'Developing: market-structure and enforcement watch',
      kind: 'regulatory',
      lifecycle: 'developing',
      scheduledAt: now - 30 * 60 * 60 * 1000,
      whatHappenedOrExpected:
        'The SEC publishes rulemaking and enforcement notices on its own site. Treat social leaks as unverified until the release exists.',
      whyMarketsMayCare:
        'A final rule can reprice a sector’s legal path. A rumor should not change size.',
      relatedAssets: ['Affected sector names (educational)'],
      relatedSectors: ['Broker-dealers', 'Crypto-adjacent (if named)', 'Exchanges'],
      historicalRelevance: 0.5,
      marketScope: 0.58,
      volatilityPotential: 0.48,
      articles: [
        {
          headline: 'SEC press releases',
          source: 'U.S. Securities and Exchange Commission',
          date: 'Ongoing',
          summary: 'Official enforcement and rulemaking notices.',
          whyItMatters: 'The release is the source. We will not invent a docket.',
          url: 'https://www.sec.gov/newsroom/press-releases',
        },
      ],
    },
    {
      id: 'story-upcoming-earnings-season',
      title: 'Upcoming: sample large-cap reporting week',
      kind: 'earnings',
      lifecycle: 'upcoming',
      scheduledAt: now + 4 * DAY,
      whatHappenedOrExpected:
        'Several large reporters typically cluster. This is a labelled sample week for practice — not your broker’s earnings calendar.',
      whyMarketsMayCare:
        'Guidance can move a name and its peers. That is event risk for size, not a buy/sell list.',
      relatedAssets: ['Reporting names (educational)', 'Sector peers'],
      relatedSectors: ['Technology', 'Consumer', 'Financials'],
      country: 'United States',
      countryCode: 'US',
      historicalRelevance: 0.6,
      marketScope: 0.55,
      volatilityPotential: 0.58,
      articles: [
        {
          headline: 'EDGAR company filings',
          source: 'U.S. Securities and Exchange Commission',
          date: 'When filed',
          summary: '10-Q, 10-K, and 8-K are the primary record. We link; we do not host filings.',
          whyItMatters: 'Read the filing. Do not scrape a copyrighted recap here.',
          url: 'https://www.sec.gov/edgar',
        },
      ],
    },
    {
      id: 'story-corporate-8k',
      title: 'Educational: how an 8-K becomes a headline',
      kind: 'corporate',
      lifecycle: 'historical',
      scheduledAt: now - 40 * DAY,
      whatHappenedOrExpected:
        'Companies furnish material events on Form 8-K. This card teaches the pipeline — it is not a live announcement.',
      whyMarketsMayCare:
        'A guidance cut or deal can gap a single name. Process: filing first, size second, no copied article body.',
      relatedAssets: ['The filing issuer (educational)'],
      relatedSectors: ['Depends on the issuer'],
      country: 'United States',
      countryCode: 'US',
      historicalRelevance: 0.45,
      marketScope: 0.35,
      volatilityPotential: 0.5,
      articles: [
        {
          headline: 'Form 8-K — current report',
          source: 'U.S. Securities and Exchange Commission',
          date: 'Official form',
          summary: 'What issuers must report on 8-K and where to find it.',
          whyItMatters: 'The form is the announcement. A blog recap is secondary.',
          url: 'https://www.sec.gov/files/form8-k.pdf',
        },
      ],
    },
  ];
}
