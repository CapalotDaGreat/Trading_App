import type { EventCategory } from '@/features/calendar/services/economic-calendar.service';
import type {
  MarketEventArticle,
  MarketEventKind,
  MarketEventTraining,
} from '../types/events.types';

export interface EventEducation {
  kind: MarketEventKind;
  category: EventCategory | MarketEventKind;
  whyTradersCare: string;
  relatedLessonId: string;
  relatedLessonTitle: string;
  practiceHref: string;
  replayHref: string;
  simulateHref: string;
  article?: {
    title: string;
    source: string;
    url: string;
    why: string;
  };
  concepts: string[];
  relatedAssets: string[];
  relatedSectors: string[];
  practiceId?: string;
  practiceTitle: string;
  practicePrompt: string;
  replayId?: string;
  replayTitle: string;
  simulatePrep?: MarketEventTraining['simulatePrep'];
  simulateTitle: string;
  articles: MarketEventArticle[];
}

const FED_ARTICLE: MarketEventArticle = {
  headline: 'Federal Open Market Committee',
  source: 'Board of Governors of the Federal Reserve System',
  date: 'Official calendar',
  summary: 'Primary-source meeting calendar, statements, and projections. We link; we do not reproduce the statement.',
  whyItMatters: 'Policy text is the source. A headline paraphrase is not a trade idea.',
  url: 'https://www.federalreserve.gov/monetarypolicy/fomc.htm',
};

const BLS_CPI: MarketEventArticle = {
  headline: 'Consumer Price Index',
  source: 'U.S. Bureau of Labor Statistics',
  date: 'Official handbook',
  summary: 'What CPI measures, how it is collected, and when it is published.',
  whyItMatters: 'Understand the print before treating a headline as a regime change.',
  url: 'https://www.bls.gov/cpi/',
};

const BLS_EMPLOYMENT: MarketEventArticle = {
  headline: 'Employment Situation',
  source: 'U.S. Bureau of Labor Statistics',
  date: 'Official handbook',
  summary: 'Payrolls, unemployment, and revisions live on the BLS release pages.',
  whyItMatters: 'First prints are revised. The skill is reading the package, not the first tick.',
  url: 'https://www.bls.gov/ces/',
};

const BEA_GDP: MarketEventArticle = {
  headline: 'Gross Domestic Product',
  source: 'U.S. Bureau of Economic Analysis',
  date: 'Official handbook',
  summary: 'How BEA defines and revises GDP.',
  whyItMatters: 'GDP is backward-looking. Revisions change the story more often than the first print.',
  url: 'https://www.bea.gov/data/gdp/gross-domestic-product',
};

const ECB_ARTICLE: MarketEventArticle = {
  headline: 'Monetary policy decisions',
  source: 'European Central Bank',
  date: 'Official calendar',
  summary: 'ECB decision calendar and introductory statements.',
  whyItMatters: 'Another policy venue, same educational job: expectations versus the text.',
  url: 'https://www.ecb.europa.eu/press/govcdec/mopo/html/index.en.html',
};

const SEC_EDGAR: MarketEventArticle = {
  headline: 'EDGAR company filings',
  source: 'U.S. Securities and Exchange Commission',
  date: 'Official filings',
  summary: '10-K, 10-Q, and 8-K filings are the primary corporate record.',
  whyItMatters: 'A press headline is not the filing. Read the source, do not scrape it here.',
  url: 'https://www.sec.gov/edgar',
};

function education(partial: EventEducation): EventEducation {
  return {
    ...partial,
    article: partial.article ?? (partial.articles[0]
      ? {
          title: partial.articles[0].headline,
          source: partial.articles[0].source,
          url: partial.articles[0].url,
          why: partial.articles[0].whyItMatters,
        }
      : undefined),
  };
}

export const EVENT_KIND_LABELS: Record<MarketEventKind, string> = {
  interest_rate: 'Rates / Fed',
  inflation: 'Inflation',
  employment: 'Employment',
  gdp: 'GDP',
  earnings: 'Earnings',
  corporate: 'Corporate',
  geopolitical: 'Geopolitical',
  regulatory: 'Regulatory',
  manufacturing: 'Manufacturing',
  consumer: 'Consumer',
  housing: 'Housing',
  trade: 'Trade',
  other: 'Market context',
};

export const EVENT_EDUCATION: Record<MarketEventKind, EventEducation> = {
  interest_rate: education({
    kind: 'interest_rate',
    category: 'interest_rate',
    whyTradersCare:
      'Policy rates change the discount rate on cash flows and the cost of leverage. Markets reprice expectations, not just the decision.',
    relatedLessonId: 'fund-economy',
    relatedLessonTitle: 'Economic environment: the weather around the name',
    practiceId: 'rate-decision-uncertainty',
    practiceTitle: 'Rate Surprise Exercise',
    practicePrompt:
      'A fictional committee decision is due. How would you prepare size and invalidation if the path of rates is unknown?',
    practiceHref: '/practice?drill=rate-decision-uncertainty',
    replayId: 'fomc-decision-lab',
    replayTitle: 'Replay a previous rate decision',
    replayHref: '/decision/replay-tv?episode=fomc-decision-lab',
    simulatePrep: 'rates',
    simulateTitle: 'Prepare for an uncertain rate decision',
    simulateHref: '/simulate?start=1&prep=rates',
    concepts: ['interest rates', 'monetary policy', 'market expectations', 'volatility', 'risk management'],
    relatedAssets: ['Duration-sensitive equities', 'Index futures (educational)', 'USD crosses', 'Short-term rates'],
    relatedSectors: ['Financials', 'Utilities', 'Technology', 'Broad index'],
    articles: [FED_ARTICLE, ECB_ARTICLE],
  }),
  inflation: education({
    kind: 'inflation',
    category: 'inflation',
    whyTradersCare:
      'Inflation prints move real yields and policy odds. The surprise versus consensus usually matters more than the level.',
    relatedLessonId: 'fund-calendar',
    relatedLessonTitle: 'Economic calendar and event risk',
    practiceId: 'inflation-asset-effects',
    practiceTitle: 'Inflation surprise — asset classes',
    practicePrompt:
      'How could an inflation surprise affect different asset classes? This is a mapping exercise, not a forecast of the next print.',
    practiceHref: '/practice?drill=inflation-asset-effects',
    replayId: 'inflation-shock-2022',
    replayTitle: 'Replay a historical inflation shock',
    replayHref: '/decision/replay-tv?episode=inflation-shock-2022',
    simulatePrep: 'inflation',
    simulateTitle: 'Fictional inflation print',
    simulateHref: '/simulate?start=1&prep=inflation',
    concepts: ['inflation', 'real yields', 'policy expectations', 'volatility', 'risk management'],
    relatedAssets: ['Nominal bonds (educational)', 'Growth equities', 'USD', 'Gold (sample context)'],
    relatedSectors: ['Technology', 'Financials', 'Consumer', 'Utilities'],
    articles: [BLS_CPI],
  }),
  employment: education({
    kind: 'employment',
    category: 'employment',
    whyTradersCare:
      'Labor data updates growth and wage-pressure guesses. First prints are revised. Positioning often matters more than the number.',
    relatedLessonId: 'fund-calendar',
    relatedLessonTitle: 'Economic calendar and event risk',
    practiceId: 'inflation-asset-effects',
    practiceTitle: 'Labor surprise — what changes together',
    practicePrompt:
      'If a labor print surprises, which asset classes often reprice together — and why is that not a prediction of this print?',
    practiceHref: '/practice?drill=inflation-asset-effects',
    replayId: 'nfp-surprise-lab',
    replayTitle: 'Replay a historical employment surprise',
    replayHref: '/decision/replay-tv?episode=nfp-surprise-lab',
    simulatePrep: 'employment',
    simulateTitle: 'Fictional labor-market report',
    simulateHref: '/simulate?start=1&prep=employment',
    concepts: ['labor market', 'growth vs inflation mix', 'revisions', 'volatility', 'risk management'],
    relatedAssets: ['USD', 'Index futures (educational)', 'Rate-sensitive equities'],
    relatedSectors: ['Cyclicals', 'Financials', 'Broad index'],
    articles: [BLS_EMPLOYMENT],
  }),
  gdp: education({
    kind: 'gdp',
    category: 'gdp',
    whyTradersCare:
      'GDP is backward-looking. Traders care when it changes the growth/inflation mix the market had already priced.',
    relatedLessonId: 'fund-economy',
    relatedLessonTitle: 'Economic environment: the weather around the name',
    practiceTitle: 'Growth mix, not a forecast',
    practicePrompt: 'What would a growth surprise change in a book that is already one-way on cyclicals?',
    practiceHref: '/practice?topic=fundamentals',
    replayId: 'sector-rotation-lab',
    replayTitle: 'Replay a sector-rotation room',
    replayHref: '/decision/replay-tv?episode=sector-rotation-lab',
    simulatePrep: 'macro',
    simulateTitle: 'Fictional growth print',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['growth', 'revisions', 'cyclical vs defensive', 'portfolio correlation'],
    relatedAssets: ['Cyclical equities', 'Defensives', 'USD'],
    relatedSectors: ['Industrials', 'Consumer discretionary', 'Staples'],
    articles: [BEA_GDP],
  }),
  earnings: education({
    kind: 'earnings',
    category: 'other',
    whyTradersCare:
      'Earnings and guidance update cash-flow guesses for one name and sometimes a sector. The first reaction is often not the thesis.',
    relatedLessonId: 'fund-statements',
    relatedLessonTitle: 'Reading statements without a story',
    practiceTitle: 'Guidance versus the print',
    practicePrompt: 'What evidence would you want after a fictional earnings print before changing size?',
    practiceHref: '/practice?topic=fundamentals',
    replayId: 'nvidia-earnings',
    replayTitle: 'Replay a historical earnings night',
    replayHref: '/decision/replay-tv?episode=nvidia-earnings',
    simulatePrep: 'earnings',
    simulateTitle: 'Fictional company report',
    simulateHref: '/simulate?start=1&prep=earnings',
    concepts: ['earnings', 'guidance', 'expectations', 'single-name risk', 'position size'],
    relatedAssets: ['The reporting name (educational)', 'Sector peers', 'Index (second-order)'],
    relatedSectors: ['The reporting sector', 'Suppliers', 'Competitors'],
    articles: [SEC_EDGAR],
  }),
  corporate: education({
    kind: 'corporate',
    category: 'other',
    whyTradersCare:
      'M&A, guidance cuts, and product events change one firm’s cash-flow path. They are not a market-wide instruction.',
    relatedLessonId: 'fund-valuation-quality',
    relatedLessonTitle: 'Valuation quality, not a price target',
    practiceTitle: 'Company news as evidence',
    practicePrompt: 'Which facts in a fictional announcement would change size versus which are just noise?',
    practiceHref: '/practice?topic=fundamentals',
    replayId: 'guidance-cut-lab',
    replayTitle: 'Replay a guidance-cut room',
    replayHref: '/decision/replay-tv?episode=guidance-cut-lab',
    simulatePrep: 'earnings',
    simulateTitle: 'Fictional company announcement',
    simulateHref: '/simulate?start=1&prep=earnings',
    concepts: ['corporate events', 'guidance', 'idiosyncratic risk', 'invalidation'],
    relatedAssets: ['The named company (educational)', 'Close peers'],
    relatedSectors: ['The named sector'],
    articles: [SEC_EDGAR],
  }),
  geopolitical: education({
    kind: 'geopolitical',
    category: 'other',
    whyTradersCare:
      'Geopolitical headlines can move energy, FX, and risk appetite. First takes are incomplete. This is context, not a signal.',
    relatedLessonId: 'dec-uncertainty',
    relatedLessonTitle: 'Deciding when information is incomplete',
    practiceTitle: 'Incomplete information',
    practicePrompt: 'What would you refuse to decide until a developing story has a primary source?',
    practiceHref: '/practice?topic=decision_making',
    replayId: 'brexit-night',
    replayTitle: 'Replay a historical geopolitical night',
    replayHref: '/decision/replay-tv?episode=brexit-night',
    simulatePrep: 'macro',
    simulateTitle: 'Fictional risk-off tape',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['uncertainty', 'risk appetite', 'energy and FX', 'position size', 'waiting'],
    relatedAssets: ['Energy (educational)', 'USD / havens', 'Broad risk assets'],
    relatedSectors: ['Energy', 'Defense', 'Airlines', 'Broad index'],
    articles: [
      {
        headline: 'U.S. Department of State — press',
        source: 'U.S. Department of State',
        date: 'Official briefings',
        summary: 'Primary-source diplomatic and security briefings. Link only.',
        whyItMatters: 'Secondary market commentary is not the event. Official text is the start of research.',
        url: 'https://www.state.gov/press-releases/',
      },
    ],
  }),
  regulatory: education({
    kind: 'regulatory',
    category: 'other',
    whyTradersCare:
      'Rules, investigations, and enforcement can reprice a sector’s legal path. The first leak is rarely the final rule.',
    relatedLessonId: 'dec-research-filter',
    relatedLessonTitle: 'Filter research before you size',
    practiceTitle: 'Rule versus rumor',
    practicePrompt: 'How would you treat an unverified regulatory headline in a fictional book?',
    practiceHref: '/practice?topic=decision_making',
    replayId: 'svb-stress',
    replayTitle: 'Replay a historical stress weekend',
    replayHref: '/decision/replay-tv?episode=svb-stress',
    simulatePrep: 'macro',
    simulateTitle: 'Fictional regulatory surprise',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['regulation', 'sector risk', 'information quality', 'risk management'],
    relatedAssets: ['Affected sector names (educational)', 'Index (second-order)'],
    relatedSectors: ['Banks', 'Technology', 'Energy — depends on the rule'],
    articles: [
      {
        headline: 'SEC press releases',
        source: 'U.S. Securities and Exchange Commission',
        date: 'Official notices',
        summary: 'Enforcement and rulemaking notices from the primary regulator.',
        whyItMatters: 'A social post is not a rule. The filing or release is.',
        url: 'https://www.sec.gov/newsroom/press-releases',
      },
    ],
  }),
  manufacturing: education({
    kind: 'manufacturing',
    category: 'manufacturing',
    whyTradersCare:
      'PMI-style prints are surveys, not cash flows. They can move cyclicals when they surprise the growth narrative.',
    relatedLessonId: 'fund-calendar',
    relatedLessonTitle: 'Economic calendar and event risk',
    practiceTitle: 'Survey versus cash flow',
    practicePrompt: 'Why might a survey print move cyclicals even though it is not a cash-flow statement?',
    practiceHref: '/practice?topic=fundamentals',
    replayId: 'sector-rotation-lab',
    replayTitle: 'Replay sector rotation',
    replayHref: '/decision/replay-tv?episode=sector-rotation-lab',
    simulatePrep: 'macro',
    simulateTitle: 'Fictional growth survey',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['survey data', 'cyclicals', 'growth narrative'],
    relatedAssets: ['Industrial equities', 'Copper-sensitive names (educational)'],
    relatedSectors: ['Industrials', 'Materials'],
    articles: [
      {
        headline: 'Institute for Supply Management',
        source: 'ISM',
        date: 'Official methodology',
        summary: 'How manufacturing PMI is constructed.',
        whyItMatters: 'A survey is not GDP. Know the instrument.',
        url: 'https://www.ismworld.org/',
      },
    ],
  }),
  consumer: education({
    kind: 'consumer',
    category: 'consumer',
    whyTradersCare:
      'Retail and confidence prints can shift cyclical vs defensive leadership. One print is not a trend.',
    relatedLessonId: 'fund-calendar',
    relatedLessonTitle: 'Economic calendar and event risk',
    practiceTitle: 'One print is not a trend',
    practicePrompt: 'What else would you need after a fictional retail print before changing a consumer-sector thesis?',
    practiceHref: '/practice?topic=fundamentals',
    replayHref: '/decision/replay-tv?episode=sector-rotation-lab',
    replayId: 'sector-rotation-lab',
    replayTitle: 'Replay leadership change',
    simulatePrep: 'macro',
    simulateTitle: 'Fictional consumer print',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['consumer demand', 'cyclical vs defensive', 'one print vs a series'],
    relatedAssets: ['Discretionary equities', 'Staples'],
    relatedSectors: ['Consumer discretionary', 'Consumer staples'],
    articles: [
      {
        headline: 'U.S. Census Bureau — monthly retail trade',
        source: 'U.S. Census Bureau',
        date: 'Official release',
        summary: 'Advance monthly retail trade methodology and tables.',
        whyItMatters: 'The Census table is the print. A TV graphic is a paraphrase.',
        url: 'https://www.census.gov/retail/index.html',
      },
    ],
  }),
  housing: education({
    kind: 'housing',
    category: 'housing',
    whyTradersCare:
      'Housing is rate-sensitive and lagged. It informs duration and credit more than a single equity ticker.',
    relatedLessonId: 'fund-calendar',
    relatedLessonTitle: 'Economic calendar and event risk',
    practiceTitle: 'Lagged rate sensitivity',
    practicePrompt: 'Why might housing data lag the rate move everyone already discussed?',
    practiceHref: '/practice?topic=fundamentals',
    replayId: 'inflation-shock-2022',
    replayTitle: 'Replay a rates-and-housing year',
    replayHref: '/decision/replay-tv?episode=inflation-shock-2022',
    simulatePrep: 'rates',
    simulateTitle: 'Fictional housing print',
    simulateHref: '/simulate?start=1&prep=rates',
    concepts: ['housing', 'interest rates', 'lagged data', 'credit'],
    relatedAssets: ['Homebuilder equities (educational)', 'Duration'],
    relatedSectors: ['Housing', 'Financials'],
    articles: [
      {
        headline: 'U.S. Census Bureau — new residential construction',
        source: 'U.S. Census Bureau',
        date: 'Official release',
        summary: 'Housing starts and permits methodology.',
        whyItMatters: 'Starts are not prices. Know which series you are reading.',
        url: 'https://www.census.gov/construction/nrc/index.html',
      },
    ],
  }),
  trade: education({
    kind: 'trade',
    category: 'trade',
    whyTradersCare:
      'Trade balances and tariffs can move FX and sectors with overseas costs. The first headline is rarely the whole story.',
    relatedLessonId: 'foundations-fx',
    relatedLessonTitle: 'Currency pairs',
    practiceTitle: 'FX and cost paths',
    practicePrompt: 'Which books are first-order exposed to a fictional trade-policy headline?',
    practiceHref: '/practice?drill=fx-convert',
    replayId: 'brexit-night',
    replayTitle: 'Replay a currency-night room',
    replayHref: '/decision/replay-tv?episode=brexit-night',
    simulatePrep: 'macro',
    simulateTitle: 'Fictional trade headline',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['trade policy', 'FX', 'supply chains', 'uncertainty'],
    relatedAssets: ['USD crosses', 'Import-heavy equities'],
    relatedSectors: ['Industrials', 'Consumer', 'Autos'],
    articles: [
      {
        headline: 'U.S. Census Bureau — international trade',
        source: 'U.S. Census Bureau',
        date: 'Official release',
        summary: 'Goods and services trade statistics.',
        whyItMatters: 'The table is the print. A political speech is commentary.',
        url: 'https://www.census.gov/foreign-trade/index.html',
      },
    ],
  }),
  other: education({
    kind: 'other',
    category: 'other',
    whyTradersCare:
      'Unknown-category events still change attention. The skill is asking what is priced and what would invalidate it.',
    relatedLessonId: 'fund-calendar',
    relatedLessonTitle: 'Economic calendar and event risk',
    practiceTitle: 'What is priced?',
    practicePrompt: 'What would have to be true for this headline to change your size — and what would you ignore?',
    practiceHref: '/practice',
    replayHref: '/decision/replay-tv',
    replayTitle: 'Open Decision Replay',
    simulatePrep: 'macro',
    simulateTitle: 'Uncertain simulation',
    simulateHref: '/simulate?start=1&prep=macro',
    concepts: ['event risk', 'expectations', 'invalidation'],
    relatedAssets: ['Depends on the headline'],
    relatedSectors: ['Depends on the headline'],
    articles: [],
  }),
};
