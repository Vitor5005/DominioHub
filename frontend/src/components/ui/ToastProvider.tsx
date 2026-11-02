import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';

import { IconButton } from './IconButton';

import {
  ToastContext,
  type ToastInput,
  type ToastTone,
} from './toast-context';

interface ToastItem
  extends ToastInput {
  id: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (
    id: string,
  ) => void;
}

function ToastIcon({
  tone,
}: {
  tone: ToastTone;
}) {
  if (tone === 'success') {
    return (
      <CheckCircle2
        size={20}
        aria-hidden="true"
      />
    );
  }

  if (tone === 'error') {
    return (
      <CircleAlert
        size={20}
        aria-hidden="true"
      />
    );
  }

  if (tone === 'warning') {
    return (
      <TriangleAlert
        size={20}
        aria-hidden="true"
      />
    );
  }

  return (
    <Info
      size={20}
      aria-hidden="true"
    />
  );
}

function ToastCard({
  item,
  onDismiss,
}: ToastCardProps) {
  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          onDismiss(item.id);
        },
        item.durationMs,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    item.durationMs,
    item.id,
    onDismiss,
  ]);

  return (
    <div
      className={`ui-toast ui-toast--${item.tone}`}
      role={
        item.tone === 'error'
          ? 'alert'
          : 'status'
      }
      aria-atomic="true"
    >
      <div className="ui-toast__icon">
        <ToastIcon
          tone={item.tone}
        />
      </div>

      <div className="ui-toast__content">
        <strong>
          {item.title}
        </strong>

        {item.description && (
          <p>
            {item.description}
          </p>
        )}
      </div>

      <IconButton
        variant="ghost"
        aria-label="Fechar notificação"
        icon={
          <X
            size={16}
            aria-hidden="true"
          />
        }
        onClick={() => {
          onDismiss(item.id);
        }}
      />
    </div>
  );
}

export function ToastProvider({
  children,
}: ToastProviderProps) {
  const [items, setItems] =
    useState<ToastItem[]>([]);

  const dismiss =
    useCallback(
      (id: string) => {
        setItems((current) =>
          current.filter(
            (item) =>
              item.id !== id,
          ),
        );
      },
      [],
    );

  const toast =
    useCallback(
      (input: ToastInput) => {
        const id =
          crypto.randomUUID();

        const item: ToastItem = {
          ...input,
          id,
          tone:
            input.tone ??
            'info',
          durationMs:
            input.durationMs ??
            4000,
        };

        setItems((current) => [
          ...current,
          item,
        ]);

        return id;
      },
      [],
    );

  const value = useMemo(
    () => ({
      toast,
      dismiss,
    }),
    [
      dismiss,
      toast,
    ],
  );

  return (
    <ToastContext.Provider
      value={value}
    >
      {children}

      <div
        className="ui-toast-viewport"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <ToastCard
            key={item.id}
            item={item}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
