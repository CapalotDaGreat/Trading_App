import { Redirect } from 'expo-router';

/** Strategy sandbox is not a primary room. Practice is the canonical judgment desk. */
export default function BacktestRedirect() {
  return <Redirect href={'/practice' as never} />;
}
