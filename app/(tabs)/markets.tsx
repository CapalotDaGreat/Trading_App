import { Redirect } from 'expo-router';

/** Legacy Markets quote board — study names now go through educational search. */
export default function MarketsRedirect() {
  return <Redirect href={'/search' as never} />;
}
