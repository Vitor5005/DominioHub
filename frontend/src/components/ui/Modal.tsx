import {
  type ReactNode,
  useId,
  useRef,
} from 'react';

import {
  createPortal,
} from 'react-dom';

import { X } from 'lucide-react';

import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';

import { cn } from '../../lib/cn';

import { IconButton } from './IconButton';

type ModalSize =
  | 'sm'
  | 'md'
  | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const dialogRef =
    useRef<HTMLDivElement>(null);

  const titleId =
    useId();

  const descriptionId =
    useId();

  useOverlayBehavior(
    open,
    onClose,
    dialogRef,
  );

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="ui-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          'ui-modal',
          `ui-modal--${size}`,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          titleId
        }
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
        tabIndex={-1}
      >
        <header className="ui-modal__header">
          <div>
            <h2 id={titleId}>
              {title}
            </h2>

            {description && (
              <p id={descriptionId}>
                {description}
              </p>
            )}
          </div>

          <IconButton
            variant="ghost"
            aria-label="Fechar"
            icon={
              <X
                size={18}
                aria-hidden="true"
              />
            }
            onClick={onClose}
          />
        </header>

        <div className="ui-modal__body">
          {children}
        </div>

        {footer && (
          <footer className="ui-modal__footer">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
