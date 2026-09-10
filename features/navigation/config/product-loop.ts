import { PRODUCT_LOOP_STEPS, type ProductLoopStep } from './navigation-ia.config';

export type ProductLoopCta = {
  id: string;
  href: string;
  label: string;
};

/**
 * Sequential CTAs for Learn → Practice → Replay → Simulate → Journal → Review → Improve.
 * Improve is Home (Training Planner), not a tab.
 */
export function resolveLoopCtas(input: {
  current?: ProductLoopStep;
  followUp?: { label: string; href: string };
  plannerNext?: { label: string; href: string } | null;
}): ProductLoopCta[] {
  const index = input.current
    ? PRODUCT_LOOP_STEPS.findIndex((step) => step.id === input.current)
    : -1;

  let sequential: ProductLoopCta[] =
    index >= 0
      ? PRODUCT_LOOP_STEPS.slice(index + 1, index + 4).map((step) => ({
          id: step.id,
          href: step.href,
          label: step.label,
        }))
      : PRODUCT_LOOP_STEPS.slice(0, 3).map((step) => ({
          id: step.id,
          href: step.href,
          label: step.label,
        }));

  if (input.plannerNext?.href) {
    const plannerCta: ProductLoopCta = {
      id: 'improve',
      href: input.plannerNext.href,
      label: input.plannerNext.label,
    };
    if (input.current === 'review') {
      sequential = [plannerCta];
    } else {
      sequential = [plannerCta, ...sequential.filter((step) => step.href !== plannerCta.href)];
    }
  } else if (input.current === 'review') {
    sequential = [{ id: 'improve', href: '/', label: 'Train next' }];
  }

  const follow = input.followUp
    ? [{ id: 'follow', href: input.followUp.href, label: input.followUp.label }]
    : [];

  const unique: ProductLoopCta[] = [];
  const seen = new Set<string>();
  for (const step of [...follow, ...sequential]) {
    if (seen.has(step.href)) continue;
    seen.add(step.href);
    unique.push(step);
  }

  if (unique.length === 0) {
    unique.push({ id: 'improve', href: '/', label: 'Train next' });
  }

  return unique.slice(0, 3);
}
