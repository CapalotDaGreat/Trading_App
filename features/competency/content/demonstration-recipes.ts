import { COMPETENCY_CONCEPTS } from './competency-taxonomy';
import type {
  CompetencyEvidenceType,
  CompetencyFamily,
  ConceptImportance,
  DemonstrationRecipe,
  DemonstrationRequirement,
  EvidenceRole,
} from '../types/competency.types';

const KNOWLEDGE: CompetencyEvidenceType[] = ['knowledge_check', 'practice_drill'];
const CALCULATION: CompetencyEvidenceType[] = ['calculation_exercise', 'practice_drill'];
const PRACTICE: CompetencyEvidenceType[] = ['practice_drill', 'calculation_exercise', 'remediation_exercise'];
const APPLICATION: CompetencyEvidenceType[] = [
  'replay_decision',
  'simulation_decision',
  'simulation_checkpoint',
  're_demonstration',
  'transfer_exercise',
  'surprise_assessment',
  'event_exercise',
];
const FUNDAMENTAL_APPLICATION: CompetencyEvidenceType[] = [
  'applied_exercise',
  'replay_decision',
  'simulation_decision',
  're_demonstration',
  'transfer_exercise',
];
const REFLECTION: CompetencyEvidenceType[] = ['journal_reflection', 'review_finding'];

function req(
  role: EvidenceRole,
  minIndependent: number,
  sources: CompetencyEvidenceType[],
  variedContexts?: number,
): DemonstrationRequirement {
  return { role, minIndependent, sources, variedContexts };
}

function recipe(
  conceptId: string,
  importance: ConceptImportance,
  requirements: DemonstrationRequirement[],
  concealOnRetest = false,
): DemonstrationRecipe {
  return { conceptId, importance, requirements, concealOnRetest };
}

function familyDefault(family: CompetencyFamily, conceptId: string): DemonstrationRecipe {
  switch (family) {
    case 'risk_management':
      return recipe(conceptId, 'supporting', [
        req('knowledge', 1, KNOWLEDGE),
        req('calculation', 1, CALCULATION),
        req('application', 1, APPLICATION),
      ]);
    case 'technical_analysis':
      return recipe(conceptId, 'supporting', [
        req('knowledge', 1, KNOWLEDGE),
        req('practice', 1, PRACTICE),
        req('application', 1, APPLICATION),
      ]);
    case 'fundamental_research':
      return recipe(conceptId, 'specialist', [
        req('knowledge', 1, KNOWLEDGE),
        req('practice', 1, PRACTICE),
        req('application', 1, FUNDAMENTAL_APPLICATION),
      ]);
    case 'psychology':
      return recipe(conceptId, 'core', [
        req('knowledge', 1, KNOWLEDGE),
        req('practice', 1, PRACTICE),
        req('application', 1, APPLICATION),
      ]);
    case 'event_risk':
      return recipe(conceptId, 'supporting', [
        req('knowledge', 1, KNOWLEDGE),
        req('application', 1, APPLICATION),
      ]);
    case 'review_process':
      return recipe(conceptId, 'supporting', [req('reflection', 2, REFLECTION)]);
    case 'thesis_decision_making':
    default:
      return recipe(conceptId, 'core', [
        req('knowledge', 1, KNOWLEDGE),
        req('practice', 1, PRACTICE),
        req('application', 1, APPLICATION),
      ]);
  }
}

/** Concept-specific bars. Completing a lesson never appears here. */
const RECIPE_OVERRIDES: Record<string, DemonstrationRecipe> = {
  'position-sizing': recipe(
    'position-sizing',
    'core',
    [
      req('knowledge', 1, KNOWLEDGE),
      req('calculation', 1, CALCULATION),
      req('application', 2, APPLICATION, 2),
    ],
    true,
  ),
  'risk-per-trade': recipe(
    'risk-per-trade',
    'core',
    [
      req('knowledge', 1, KNOWLEDGE),
      req('calculation', 1, CALCULATION),
      req('application', 1, APPLICATION),
    ],
    true,
  ),
  invalidation: recipe(
    'invalidation',
    'core',
    [
      req('knowledge', 1, KNOWLEDGE),
      req('practice', 1, PRACTICE),
      req('application', 1, APPLICATION),
    ],
    true,
  ),
  'stop-logic': recipe('stop-logic', 'core', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, APPLICATION),
  ]),
  thesis: recipe('thesis', 'core', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, APPLICATION),
  ]),
  fomo: recipe(
    'fomo',
    'core',
    [
      req('knowledge', 1, KNOWLEDGE),
      req('practice', 1, PRACTICE),
      req('application', 1, APPLICATION),
    ],
    true,
  ),
  'revenge-trading': recipe('revenge-trading', 'core', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, APPLICATION),
  ]),
  journaling: recipe('journaling', 'supporting', [req('reflection', 2, REFLECTION)]),
  'following-a-plan': recipe('following-a-plan', 'core', [
    req('reflection', 1, REFLECTION),
    req('practice', 1, PRACTICE),
  ]),
  rsi: recipe('rsi', 'supporting', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, APPLICATION),
  ]),
  earnings: recipe(
    'earnings',
    'core',
    [
      req('knowledge', 1, KNOWLEDGE),
      req('practice', 1, PRACTICE),
      req('application', 1, FUNDAMENTAL_APPLICATION, 2),
    ],
    true,
  ),
  valuation: recipe(
    'valuation',
    'core',
    [
      req('knowledge', 1, KNOWLEDGE),
      req('practice', 1, PRACTICE),
      req('application', 1, FUNDAMENTAL_APPLICATION, 2),
    ],
    true,
  ),
  'revenue-growth': recipe('revenue-growth', 'supporting', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, FUNDAMENTAL_APPLICATION),
  ]),
  'balance-sheet': recipe('balance-sheet', 'supporting', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, FUNDAMENTAL_APPLICATION),
  ]),
  'business-quality': recipe('business-quality', 'supporting', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, FUNDAMENTAL_APPLICATION),
  ]),
  'competitive-position': recipe('competitive-position', 'supporting', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, FUNDAMENTAL_APPLICATION),
  ]),
  'fundamental-uncertainty': recipe('fundamental-uncertainty', 'supporting', [
    req('knowledge', 1, KNOWLEDGE),
    req('practice', 1, PRACTICE),
    req('application', 1, FUNDAMENTAL_APPLICATION),
  ]),
};

export function recipeFor(conceptId: string): DemonstrationRecipe {
  const override = RECIPE_OVERRIDES[conceptId];
  if (override) return override;
  const node = COMPETENCY_CONCEPTS.find((item) => item.id === conceptId);
  return familyDefault(node?.family ?? 'thesis_decision_making', conceptId);
}

export function sourcesForRole(role: EvidenceRole): CompetencyEvidenceType[] {
  switch (role) {
    case 'knowledge':
      return KNOWLEDGE;
    case 'calculation':
      return CALCULATION;
    case 'practice':
      return PRACTICE;
    case 'application':
    case 'redemonstration':
      return [...new Set([...APPLICATION, ...FUNDAMENTAL_APPLICATION])];
    case 'reflection':
      return REFLECTION;
    case 'remediation':
      return ['remediation_exercise', 'practice_drill'];
    default:
      return PRACTICE;
  }
}
