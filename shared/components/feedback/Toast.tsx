import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { announceForAccessibility } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, string> = {
  info: 'border-border bg-background-elevated',
  success: 'border-bullish/40 bg-bullish-muted',
  error: 'border-bearish/40 bg-bearish-muted',
  warning: 'border-warning/40 bg-warning-muted',
};

const DEFAULT_DURATION = 3500;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const entry: ToastMessage = { ...toast, id };

      setToasts((prev) => [...prev.slice(-2), entry]);
      announceForAccessibility(toast.message ? `${toast.title}. ${toast.message}` : toast.title);

      const timer = setTimeout(() => dismiss(id), toast.duration ?? DEFAULT_DURATION);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      dismiss,
      success: (title, message) => show({ type: 'success', title, message }),
      error: (title, message) => show({ type: 'error', title, message }),
      warning: (title, message) => show({ type: 'warning', title, message }),
      info: (title, message) => show({ type: 'info', title, message }),
    }),
    [show, dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        accessibilityLiveRegion="polite"
        className="absolute left-0 right-0 z-50 px-4"
        style={{ top: insets.top + 8, pointerEvents: 'box-none' }}
      >
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={reduceMotion ? undefined : FadeInUp.springify()}
            exiting={reduceMotion ? undefined : FadeOutUp}
            className="mb-2"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${toast.title}${toast.message ? `. ${toast.message}` : ''}`}
              onPress={() => dismiss(toast.id)}
              className={cn('min-h-11 rounded-xl border px-4 py-3', typeStyles[toast.type])}
            >
              <Text variant="label" className="text-text-primary">
                {toast.title}
              </Text>
              {toast.message ? (
                <Text variant="caption" className="mt-0.5 text-text-secondary">
                  {toast.message}
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
