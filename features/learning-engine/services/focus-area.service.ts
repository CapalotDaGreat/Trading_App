import type { FocusArea, FocusTone } from '../types/learning-engine.types';
import type { LearningEvidenceSnapshot } from './learning-evidence.service';
import { scoreAllConceptMastery } from './concept-mastery.service';
import { getConcept } from './learning-graph.service';

const TONE_TITLE: Record<FocusTone, string> = {
  area_to_improve: 'Area to improve',
  developing_skill: 'Developing skill',
  practice_opportunity: 'Practice opportunity',
};

const FORBIDDEN = /you are bad|bad at trading|terrible|incompetent/i;

function area(
  tone: FocusTone,
  conceptId: string,
  explanation: string,
  evidence: string[],
  href: string,
): FocusArea {
  const node = getConcept(conceptId);
  return {
    tone,
    title: `${TONE_TITLE[tone]}: ${node?.title ?? conceptId}`,
    explanation,
    evidence,
    href,
    conceptId,
  };
}

export function detectFocusAreas(snapshot: LearningEvidenceSnapshot): FocusArea[] {
  const out: FocusArea[] = [];
  const mastery = scoreAllConceptMastery(snapshot.byConcept, snapshot.now);

  for (const row of mastery) {
    const slice = snapshot.byConcept[row.conceptId];
    if (!slice) continue;
    const node = getConcept(row.conceptId);
    const href = node?.drillIds[0] ? `/practice?drill=${node.drillIds[0]}` : `/academy/lesson/${node?.lessonIds[0] ?? ''}`;

    if (row.state === 'developing') {
      out.push(
        area(
          'area_to_improve',
          row.conceptId,
          `Recent checks on ${row.title} show a practice opportunity — not a verdict on you as a trader.`,
          row.evidence,
          href,
        ),
      );
    } else if (row.state === 'exposed') {
      out.push(
        area(
          'practice_opportunity',
          row.conceptId,
          `You read about ${row.title}. The next demonstration is an exercise, not another reread.`,
          row.evidence,
          href,
        ),
      );
    } else if (row.state === 'practicing' && (slice.drillAttempts >= 1 || slice.quizAttempts >= 1)) {
      out.push(
        area('developing_skill', row.conceptId, `${row.title} is in progress. Keep the loop short.`, row.evidence, href),
      );
    }
  }

  const sizeMistakes = snapshot.journalMistakes.filter((item) => item === 'size').length;
  if (sizeMistakes >= 2) {
    out.push(
      area(
        'area_to_improve',
        'position-sizing',
        'Your recent decisions show an opportunity to improve position sizing.',
        [`${sizeMistakes} journal notes tagged size in the last entries.`],
        '/practice?drill=position-size',
      ),
    );
  }

  const invalidationMistakes = snapshot.journalMistakes.filter((item) => item === 'invalidation').length;
  if (invalidationMistakes >= 2) {
    out.push(
      area(
        'practice_opportunity',
        'invalidation',
        'Several notes mention invalidation. A short refresh beats guessing the next tick.',
        [`${invalidationMistakes} journal notes named invalidation.`],
        '/academy/lesson/dec-invalidation',
      ),
    );
  }

  if (snapshot.journalMistakes.filter((item) => item === 'fomo' || item === 'revenge').length >= 2) {
    out.push(
      area(
        'developing_skill',
        'fomo',
        'Emotional tags are showing up. That is a process observation, not a character label.',
        ['Recent journal emotions or FOMO/revenge tags.'],
        '/academy/lesson/psych-fomo',
      ),
    );
  }

  if (snapshot.highConfidenceMistakes >= 2) {
    out.push(
      area(
        'practice_opportunity',
        'overconfidence',
        'High confidence showed up alongside a process miss. Calibration is the skill.',
        [`${snapshot.highConfidenceMistakes} confident entries also named a size or FOMO miss.`],
        '/academy/lesson/psych-overconfidence',
      ),
    );
  }

  const gapText = snapshot.simulationGaps.join(' ').toLowerCase();
  if (gapText.includes('sizing') || gapText.includes('size')) {
    out.push(
      area(
        'area_to_improve',
        'position-sizing',
        'The paper book is missing written size on some fills. Simulated P/L is not the grade.',
        snapshot.simulationGaps.filter((item) => /size/i.test(item)),
        '/practice?drill=position-size',
      ),
    );
  }
  if (gapText.includes('invalidation') || gapText.includes('prove the idea wrong')) {
    out.push(
      area(
        'practice_opportunity',
        'invalidation',
        'Simulation notes show invalidation is still implicit.',
        snapshot.simulationGaps.filter((item) => /invalid|wrong/i.test(item)),
        '/academy/lesson/dec-invalidation',
      ),
    );
  }
  if (gapText.includes('thesis')) {
    out.push(
      area(
        'developing_skill',
        'thesis',
        'Thesis text is thin on recent simulated fills. Write the claim before the size.',
        snapshot.simulationGaps.filter((item) => /thesis/i.test(item)),
        '/academy/lesson/dec-thesis',
      ),
    );
  }

  const unique = new Map<string, FocusArea>();
  for (const item of out) {
    if (FORBIDDEN.test(`${item.title} ${item.explanation}`)) continue;
    if (!unique.has(item.conceptId)) unique.set(item.conceptId, item);
  }
  return [...unique.values()].slice(0, 5);
}
