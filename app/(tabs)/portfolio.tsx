import { Redirect } from 'expo-router';

/** Legacy Portfolio tab — paper trading now lives under Simulate. */
export default function PortfolioRedirect() {
  return <Redirect href={'/simulate' as never} />;
}
