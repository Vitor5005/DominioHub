import {
  useEffect,
  useRef,
} from 'react';

import {
  X,
} from 'lucide-react';

import {
  IconButton,
} from '../ui/IconButton';

import {
  useOverlayBehavior,
} from '../../hooks/useOverlayBehavior';

import {
  AppSidebar,
} from './AppSidebar';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavigation({
  open,
  onClose,
}: MobileNavigationProps) {
  const navigationRef =
    useRef<HTMLElement>(null);

  useOverlayBehavior(
    open,
    onClose,
    navigationRef,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const mediaQuery = window.matchMedia(
      '(min-width: 768px)',
    );

    function handleViewportChange(
      event: MediaQueryListEvent,
    ) {
      if (event.matches) {
        onClose();
      }
    }

    mediaQuery.addEventListener(
      'change',
      handleViewportChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleViewportChange,
      );
    };
  }, [
    onClose,
    open,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div className="mobile-navigation">
      <button
        className="mobile-navigation__backdrop"
        type="button"
        aria-label="Fechar navegação"
        onClick={onClose}
      />

      <aside
        ref={navigationRef}
        id="mobile-navigation-panel"
        className="mobile-navigation__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Navegação principal"
        tabIndex={-1}
      >
        <IconButton
          className="mobile-navigation__close"
          variant="ghost"
          aria-label="Fechar navegação"
          icon={
            <X
              size={20}
              aria-hidden="true"
            />
          }
          onClick={onClose}
        />

        <AppSidebar onNavigate={onClose} />
      </aside>
    </div>
  );
}
