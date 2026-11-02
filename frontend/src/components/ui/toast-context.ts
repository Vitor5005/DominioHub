import {
  createContext,
} from 'react';

export type ToastTone =
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

export interface ToastContextValue {
  toast(
    input: ToastInput,
  ): string;

  dismiss(
    id: string,
  ): void;
}

export const ToastContext =
  createContext<ToastContextValue | null>(
    null,
  );
