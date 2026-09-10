import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type { HelpLevel } from '@/features/competency';

import type { LearnerBehaviorEvent, LearnerBehaviorEventType, SelfConfidenceReport } from '../types/learner-model.types';

export const LEARNER_BEHAVIOR_STORAGE_KEY = 'tradevision-learner-behavior-v1';

const PER_USER_EVENT_CAP = 400;
const PER_USER_CONFIDENCE_CAP = 40;

interface LearnerBehaviorState {
  eventsByUser: Record<string, LearnerBehaviorEvent[]>;
  selfConfidenceByUser: Record<string, SelfConfidenceReport[]>;
  recordEvent: (input: {
    uid: string;
    type: LearnerBehaviorEventType;
    occurredAt?: number;
    durationMs?: number;
    activityKey?: string;
    conceptId?: string;
    helpLevel?: HelpLevel;
  }) => LearnerBehaviorEvent | null;
  recordSelfConfidence: (input: { uid: string; value: number; occurredAt?: number; conceptId?: string }) => SelfConfidenceReport | null;
  importEvents: (
    uid: string,
    events: LearnerBehaviorEvent[],
    reports?: SelfConfidenceReport[],
  ) => void;
  eventsFor: (uid: string) => LearnerBehaviorEvent[];
  selfConfidenceFor: (uid: string) => SelfConfidenceReport[];
  resetUser: (uid: string) => void;
  resetAll: () => void;
}

function scoped<T>(map: Record<string, T[]>, uid: string): T[] {
  return map[uid] ?? [];
}

function eventId(input: { uid: string; type: string; occurredAt: number; activityKey?: string }): string {
  return `lb_${input.uid}_${input.type}_${input.occurredAt}_${input.activityKey ?? 'na'}`;
}

export const useLearnerBehaviorStore = create<LearnerBehaviorState>()(
  persist(
    (set, get) => ({
      eventsByUser: {},
      selfConfidenceByUser: {},

      recordEvent: (input) => {
        const uid = input.uid.trim();
        if (!uid) return null;
        const occurredAt = input.occurredAt ?? Date.now();
        const event: LearnerBehaviorEvent = {
          id: eventId({ uid, type: input.type, occurredAt, activityKey: input.activityKey }),
          uid,
          type: input.type,
          occurredAt,
          durationMs: input.durationMs,
          activityKey: input.activityKey,
          conceptId: input.conceptId,
          helpLevel: input.helpLevel,
        };
        const current = scoped(get().eventsByUser, uid);
        if (current.some((item) => item.id === event.id)) return current.find((item) => item.id === event.id) ?? event;
        set({
          eventsByUser: {
            ...get().eventsByUser,
            [uid]: [...current, event].slice(-PER_USER_EVENT_CAP),
          },
        });
        return event;
      },

      recordSelfConfidence: (input) => {
        const uid = input.uid.trim();
        if (!uid) return null;
        const value = Math.max(0, Math.min(100, Math.round(input.value)));
        if (!Number.isFinite(value)) return null;
        const occurredAt = input.occurredAt ?? Date.now();
        const report: SelfConfidenceReport = {
          id: `sc_${uid}_${occurredAt}`,
          uid,
          occurredAt,
          value,
          conceptId: input.conceptId,
        };
        const current = scoped(get().selfConfidenceByUser, uid);
        set({
          selfConfidenceByUser: {
            ...get().selfConfidenceByUser,
            [uid]: [...current, report].slice(-PER_USER_CONFIDENCE_CAP),
          },
        });
        return report;
      },

      eventsFor: (uid) => scoped(get().eventsByUser, uid).slice(),
      importEvents: (uid, events, reports = []) => {
        if (!uid.trim()) return;
        const currentEvents = scoped(get().eventsByUser, uid);
        const byId = new Map(currentEvents.map((row) => [row.id, row]));
        for (const event of events) {
          if (event.uid !== uid) continue;
          if (!byId.has(event.id)) byId.set(event.id, event);
        }
        const currentReports = scoped(get().selfConfidenceByUser, uid);
        const reportById = new Map(currentReports.map((row) => [row.id, row]));
        for (const report of reports) {
          if (report.uid !== uid) continue;
          if (!reportById.has(report.id)) reportById.set(report.id, report);
        }
        set({
          eventsByUser: {
            ...get().eventsByUser,
            [uid]: [...byId.values()].sort((a, b) => a.occurredAt - b.occurredAt).slice(-PER_USER_EVENT_CAP),
          },
          selfConfidenceByUser: {
            ...get().selfConfidenceByUser,
            [uid]: [...reportById.values()].sort((a, b) => a.occurredAt - b.occurredAt).slice(-PER_USER_CONFIDENCE_CAP),
          },
        });
      },
      selfConfidenceFor: (uid) => scoped(get().selfConfidenceByUser, uid).slice(),

      resetUser: (uid) => {
        const eventsByUser = { ...get().eventsByUser };
        const selfConfidenceByUser = { ...get().selfConfidenceByUser };
        delete eventsByUser[uid];
        delete selfConfidenceByUser[uid];
        set({ eventsByUser, selfConfidenceByUser });
      },

      resetAll: () => set({ eventsByUser: {}, selfConfidenceByUser: {} }),
    }),
    {
      name: LEARNER_BEHAVIOR_STORAGE_KEY,
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
