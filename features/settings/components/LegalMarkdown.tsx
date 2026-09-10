import { Fragment, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/shared/components/ui/Text';
import { legalPath } from '@/shared/legal';
import { inAppLegalPath, parseLegalInline, parseLegalMarkdown, type LegalInline } from '@/shared/legal/parse-legal-markdown';
import { openExternalUrl } from '@/shared/utils/open-url';

interface LegalMarkdownProps {
  markdown: string;
  /** Skip a leading H1 that repeats the screen title. */
  skipTitle?: string;
}

function headingVariant(level: 1 | 2 | 3): 'h2' | 'h3' | 'label' {
  if (level === 1) return 'h2';
  if (level === 2) return 'h3';
  return 'label';
}

function InlineNodes({ nodes }: { nodes: LegalInline[] }) {
  const router = useRouter();

  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'text') {
          return <Fragment key={index}>{node.value}</Fragment>;
        }
        if (node.type === 'bold') {
          return (
            <Text key={index} className="font-semibold text-text-primary">
              <InlineNodes nodes={node.children} />
            </Text>
          );
        }
        if (node.type === 'code') {
          return (
            <Text key={index} variant="mono" className="text-[13px] text-text-primary">
              {node.value}
            </Text>
          );
        }

        const inApp = inAppLegalPath(node.href);
        const onPress = () => {
          if (inApp) {
            router.push(inApp as never);
            return;
          }
          void openExternalUrl(node.href);
        };

        return (
          <Text key={index} className="text-accent" onPress={onPress} accessibilityRole="link">
            <InlineNodes nodes={node.children} />
          </Text>
        );
      })}
    </>
  );
}

function RichText({
  text,
  variant = 'body',
  className,
  headingLevel,
}: {
  text: string;
  variant?: 'body' | 'body-sm' | 'h2' | 'h3' | 'label';
  className?: string;
  headingLevel?: 1 | 2 | 3;
}) {
  const lines = text.split('\n');
  const content: ReactNode[] = [];

  lines.forEach((line, index) => {
    if (index > 0) {
      content.push('\n');
    }
    content.push(<InlineNodes key={index} nodes={parseLegalInline(line)} />);
  });

  return (
    <Text variant={variant} headingLevel={headingLevel} className={className}>
      {content}
    </Text>
  );
}

export function LegalMarkdown({ markdown, skipTitle }: LegalMarkdownProps) {
  const blocks = parseLegalMarkdown(markdown);
  const start =
    skipTitle &&
    blocks[0]?.type === 'heading' &&
    blocks[0].level === 1 &&
    blocks[0].text.replace(/&amp;/g, '&') === skipTitle
      ? 1
      : 0;

  return (
    <View className="gap-4 pb-8">
      {blocks.slice(start).map((block, index) => {
        if (block.type === 'heading') {
          return (
            <RichText
              key={`h-${index}`}
              text={block.text}
              variant={headingVariant(block.level)}
              headingLevel={block.level}
              className={index === 0 && start === 0 ? 'mt-1' : 'mt-3 text-text-primary'}
            />
          );
        }

        if (block.type === 'paragraph') {
          return (
            <RichText
              key={`p-${index}`}
              text={block.text}
              variant="body"
              className="leading-7 text-text-primary"
            />
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`l-${index}`} className="gap-2.5 pl-0.5">
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} className="flex-row items-start">
                  <Text variant="body" className="w-6 pt-px text-text-tertiary">
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <View className="flex-1">
                    <RichText text={item} variant="body" className="leading-7 text-text-primary" />
                  </View>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'table') {
          return (
            <View key={`t-${index}`} className="gap-3">
              {block.rows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  className="rounded-2xl bg-background-elevated px-4 py-3.5"
                >
                  {block.headers.map((header, colIndex) =>
                    row[colIndex] ? (
                      <View key={header} className={colIndex > 0 ? 'mt-3' : undefined}>
                        <Text variant="caption" className="text-text-tertiary">
                          {header}
                        </Text>
                        <RichText
                          text={row[colIndex]}
                          variant="body-sm"
                          className="mt-0.5 leading-6 text-text-primary"
                        />
                      </View>
                    ) : null,
                  )}
                </View>
              ))}
            </View>
          );
        }

        return <View key={`r-${index}`} className="my-1 h-px bg-border" />;
      })}
    </View>
  );
}

interface LegalSupportBodyProps {
  onEmail?: () => void;
}

export function LegalSupportBody({ onEmail }: LegalSupportBodyProps) {
  const router = useRouter();
  const documents = [
    ['Privacy Policy', 'privacy'],
    ['Terms of Service', 'terms'],
    ['Risk Disclaimer', 'risk'],
    ['Security Notice', 'security'],
    ['Account Deletion', 'accountDeletion'],
  ] as const;

  return (
    <View className="gap-5 pb-8">
      <Text variant="body" className="leading-7 text-text-primary">
        TradeAcademy is an educational research and decision-coaching app. It is not a broker and
        does not provide buy/sell signals or execute trades.
      </Text>

      {onEmail ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Email support"
          accessibilityHint="Opens the configured support mailbox."
          onPress={onEmail}
          className="min-h-11 justify-center rounded-2xl bg-background-elevated px-4 py-3"
        >
          <Text variant="caption" className="text-text-tertiary">
            Email
          </Text>
          <Text variant="label" className="mt-0.5 text-accent">
            Email support
          </Text>
        </Pressable>
      ) : (
        <View className="rounded-2xl bg-background-elevated px-4 py-3">
          <Text variant="caption" className="text-text-tertiary">
            Email
          </Text>
          <Text variant="body" className="mt-0.5 leading-6 text-text-primary">
            Aithera has not published a production support mailbox yet. Use the in-app legal
            documents below, or Settings → Privacy for deletion and data requests. Do not treat
            bracketed template fields in the policies as live email addresses.
          </Text>
        </View>
      )}

      <View className="gap-2">
        {documents.map(([label, id]) => (
          <Pressable
            key={id}
            accessibilityRole="link"
            accessibilityLabel={label}
            onPress={() => router.push(legalPath(id))}
            className="min-h-11 justify-center rounded-2xl bg-background-elevated px-4 py-3"
          >
            <Text variant="label" className="text-text-primary">
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
