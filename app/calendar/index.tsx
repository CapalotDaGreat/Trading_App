import { Redirect } from 'expo-router';

/** Calendar ingest remains in `features/calendar`. The user-facing desk is Events. */
export default function CalendarRedirect() {
  return <Redirect href={'/events' as never} />;
}
