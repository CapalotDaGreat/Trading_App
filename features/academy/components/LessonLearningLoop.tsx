import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { EducationalChart } from '@/features/academy/components/EducationalChart';
import { LessonExerciseCard } from '@/features/academy/components/LessonExerciseCard';
import { LessonQuiz } from '@/features/academy/components/LessonQuiz';
import { LessonSections } from '@/features/academy/components/LessonSections';
import { TermHint } from '@/features/academy/components/TermHint';
import { getLocalLessonById } from '@/features/academy/content';
import { getCompetencyConcept } from '@/features/competency/services/taxonomy.service';
import { glossaryForTags } from '@/features/academy/content/glossary';
import type { Lesson, LessonExerciseKind } from '@/features/academy/types/academy.types';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

function withLessonQuery(href: string, lessonId: string): string {
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}fromLesson=${encodeURIComponent(lessonId)}`;
}

interface LessonLearningLoopProps {
  lesson: Lesson;
  quizBestScore?: number;
  onPracticeLink: (href: string) => void;
  onQuizComplete: (score: number) => void;
  onQuizAnswer: (input: { questionId: string; correct: boolean; conceptId?: string }) => void;
  onExerciseComplete: (input: {
    correct?: boolean;
    conceptId?: string;
    kind?: LessonExerciseKind;
    exerciseId?: string;
    guided?: boolean;
    asTransfer?: boolean;
    scenarioContext?: import('@/features/academy/types/academy.types').LessonExercise['scenarioContext'];
    interactingConceptIds?: string[];
  }) => void;
}

export function LessonLearningLoop({
  lesson,
  quizBestScore,
  onPracticeLink,
  onQuizComplete,
  onQuizAnswer,
  onExerciseComplete,
}: LessonLearningLoopProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const charts = [
    ...(lesson.educationalCharts ?? []),
    ...lesson.sections.map((section) => section.chart).filter(Boolean),
  ].filter((spec, index, all) => spec && all.findIndex((item) => item?.id === spec.id) === index);

  return (
    <View className="mt-6 gap-4">
      <CollapsibleSection
        title="1. Understand"
        description="Objectives, why it matters, and the idea — not a glossary dump."
        defaultExpanded
      >
        {lesson.learningObjectives?.length ? (
          <View className="mb-3">
            {lesson.learningObjectives.map((item) => (
              <Text key={item} variant="body-sm" className="mb-1 text-text-secondary">
                • {item}
              </Text>
            ))}
          </View>
        ) : null}
        {lesson.whyItMatters ? (
          <Text variant="body" className="mb-3 text-text-secondary">
            {lesson.whyItMatters}
          </Text>
        ) : null}
        <LessonSections
          sections={lesson.sections.map((section) => ({ ...section, chart: undefined }))}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="2. See"
        description="Educational tape — labelled sample, never a live venue."
        defaultExpanded={charts.length > 0}
      >
        {charts.length === 0 ? (
          <Text variant="body-sm" className="text-text-secondary">
            This idea is not primarily a price-pattern lesson. Use the examples above, then practise the
            judgment.
          </Text>
        ) : (
          charts.map((spec) =>
            spec ? (
              <View key={spec.id} className="mb-3">
                <EducationalChart spec={spec} />
              </View>
            ) : null,
          )
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="3. Practice"
        description="Think on the page. Multiple choice is not the only move."
        defaultExpanded
      >
        {lesson.exercises?.length ? (
          lesson.exercises.map((exercise) => (
            <LessonExerciseCard
              key={exercise.id}
              exercise={exercise}
              onComplete={(result) =>
                onExerciseComplete({
                  correct: result.correct,
                  conceptId: exercise.conceptId,
                  kind: exercise.kind,
                  exerciseId: exercise.id,
                  guided: exercise.guided,
                  asTransfer: exercise.asTransfer,
                  scenarioContext: exercise.scenarioContext,
                  interactingConceptIds: exercise.interactingConceptIds,
                })
              }
            />
          ))
        ) : (
          <Text variant="body-sm" className="text-text-secondary">
            Use the chart exercise above if present, then the knowledge check in Review.
          </Text>
        )}
        {lesson.practicalExamples?.length ? (
          <View className="mt-3">
            <Text variant="label">Examples</Text>
            {lesson.practicalExamples.map((item) => (
              <Text key={item} variant="body-sm" className="mt-1 text-text-secondary">
                • {item}
              </Text>
            ))}
          </View>
        ) : null}
        {lesson.limitations?.length ? (
          <View className="mt-3">
            <Text variant="label">Limitations</Text>
            {lesson.limitations.map((item) => (
              <Text key={item} variant="caption" className="mt-1 text-text-secondary">
                {item}
              </Text>
            ))}
          </View>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        title="4. Apply"
        description="Practice, Replay, Simulation, Journal — same ecosystem."
        defaultExpanded
      >
        {lesson.practiceLinks.map((link) => (
          <Pressable
            key={link.href + link.label}
            onPress={() => onPracticeLink(withLessonQuery(link.href, lesson.id))}
            className="mb-2 flex-row items-center rounded-2xl bg-surface px-4 py-3"
          >
            <View className="flex-1">
              <Text variant="body" className="font-semibold">
                {link.label}
              </Text>
              {link.description ? (
                <Text variant="caption" className="mt-0.5">
                  {link.description}
                </Text>
              ) : null}
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.accent.primary} />
          </Pressable>
        ))}
        {(lesson.simulationLinks ?? []).map((link) => (
          <Pressable
            key={`sim-${link.href}-${link.label}`}
            onPress={() => onPracticeLink(withLessonQuery(link.href, lesson.id))}
            className="mb-2 flex-row items-center rounded-2xl bg-surface px-4 py-3"
          >
            <View className="flex-1">
              <Text variant="body" className="font-semibold">
                {link.label}
              </Text>
              {link.description ? (
                <Text variant="caption" className="mt-0.5">
                  {link.description}
                </Text>
              ) : null}
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.accent.primary} />
          </Pressable>
        ))}
        {(lesson.replayLinks ?? [])
          .filter(
            (link) =>
              !lesson.practiceLinks.some((existing) => existing.href === link.href) &&
              !(lesson.simulationLinks ?? []).some((existing) => existing.href === link.href),
          )
          .map((link) => (
            <Pressable
              key={`replay-${link.href}-${link.label}`}
              onPress={() => onPracticeLink(withLessonQuery(link.href, lesson.id))}
              className="mb-2 flex-row items-center rounded-2xl bg-surface px-4 py-3"
            >
              <View className="flex-1">
                <Text variant="body" className="font-semibold">
                  {link.label}
                </Text>
                {link.description ? (
                  <Text variant="caption" className="mt-0.5">
                    {link.description}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.accent.primary} />
            </Pressable>
          ))}
        <Button
          variant="ghost"
          onPress={() =>
            onPracticeLink(withLessonQuery(lesson.journalHref ?? '/journal?from=academy', lesson.id))
          }
        >
          Journal this reasoning
        </Button>
      </CollapsibleSection>

      <CollapsibleSection
        title="5. Review"
        description="Knowledge check, takeaways, and related lessons."
        defaultExpanded
      >
        {typeof quizBestScore === 'number' ? (
          <Text variant="caption" className="mb-3 text-text-tertiary">
            Knowledge check best: {quizBestScore}% — reading a lesson is not demonstration.
          </Text>
        ) : null}
        {lesson.whenItWorks?.length ? (
          <View className="mb-4">
            <Text variant="label">When this helps</Text>
            {lesson.whenItWorks.map((item) => (
              <Text key={item} variant="body-sm" className="mt-1 text-text-secondary">
                • {item}
              </Text>
            ))}
          </View>
        ) : null}
        {lesson.commonMistakes?.length ? (
          <View className="mb-4">
            <Text variant="label">Common mistakes</Text>
            {lesson.commonMistakes.map((item) => (
              <Text key={item} variant="body-sm" className="mt-1 text-text-secondary">
                • {item}
              </Text>
            ))}
          </View>
        ) : null}
        {lesson.whenItFails?.length ? (
          <View className="mb-4">
            <Text variant="label">When the concept fails</Text>
            {lesson.whenItFails.map((item) => (
              <Text key={item} variant="body-sm" className="mt-1 text-text-secondary">
                • {item}
              </Text>
            ))}
          </View>
        ) : null}
        {glossaryForTags(lesson.tags).map((term) => (
          <TermHint key={term.id} term={term} />
        ))}
        {lesson.keyTakeaways.length > 0 ? (
          <View className="mb-4 mt-2">
            <Text variant="h3" className="mb-2">
              Key takeaways
            </Text>
            {lesson.keyTakeaways.map((item) => (
              <Text key={item} variant="body-sm" className="mb-2 text-text-primary">
                • {item}
              </Text>
            ))}
          </View>
        ) : null}
        {lesson.quiz.length > 0 ? (
          <LessonQuiz
            questions={lesson.quiz}
            bestScore={quizBestScore}
            onComplete={onQuizComplete}
            onAnswer={onQuizAnswer}
          />
        ) : null}
        {lesson.relatedLessonIds.length > 0 ? (
          <View className="mt-4">
            <Text variant="h3" className="mb-2">
              Related lessons
            </Text>
            {lesson.relatedLessonIds.map((id) => {
              const related = getLocalLessonById(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => router.push(`/academy/lesson/${id}` as never)}
                  className="mb-2 rounded-xl bg-surface px-3 py-2.5"
                >
                  <Text variant="body-sm" className="text-accent">
                    {related?.title ?? id}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {(lesson.conceptIds ?? []).length ? (
          <View className="mt-4">
            <Text variant="h3" className="mb-2">
              Related concepts
            </Text>
            {(lesson.conceptIds ?? []).map((id) => {
              const concept = getCompetencyConcept(id);
              return (
                <Text key={id} variant="body-sm" className="mb-1 text-text-secondary">
                  {concept?.title ?? id.replace(/-/g, ' ')}
                </Text>
              );
            })}
          </View>
        ) : null}
      </CollapsibleSection>
    </View>
  );
}
