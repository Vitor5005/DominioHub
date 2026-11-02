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

import { IconButton } from './IconButton';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: DrawerProps) {
  const drawerRef =
    useRef<HTMLDivElement>(null);

  const titleId =
    useId();

  const descriptionId =
    useId();

  useOverlayBehavior(
    open,
    onClose,
    drawerRef,
  );

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="ui-overlay ui-overlay--drawer"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        ref={drawerRef}
        className="ui-drawer"
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
        <header className="ui-drawer__header">
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

        <div className="ui-drawer__body">
          {children}
        </div>

        {footer && (
          <footer className="ui-drawer__footer">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}
