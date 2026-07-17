/**
 * Firebase Cloud Functions scaffold for TradeVision Cloud AI.
 * Deploy separately: `cd functions && npm install && firebase deploy --only functions`
 *
 * Set EXPO_PUBLIC_AI_API_URL to your deployed function base URL.
 */
import * as functions from 'firebase-functions';

interface BriefRequest {
  context: Record<string, unknown>;
  type: string;
}

export const aiBrief = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const body = req.body as BriefRequest;
  const symbol = (body.context?.symbol as string) ?? 'MARKET';
  const bias = (body.context?.overallBias as string) ?? 'neutral';

  res.json({
    summary: `${symbol}: Cloud AI brief (${bias}). Wire your LLM provider here with citations to indicator values.`,
    action: bias === 'neutral' ? 'skip' : 'research',
    confidence: 72,
    citations: [
      { label: 'Symbol', value: symbol },
      { label: 'Bias', value: bias },
      { label: 'Source', value: 'tradevision-cloud-stub' },
    ],
  });
});
