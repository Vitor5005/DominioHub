import {
  type RefObject,
  useEffect,
} from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useOverlayBehavior(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = 'hidden';

    const container =
      containerRef.current;

    const focusables =
      container?.querySelectorAll<HTMLElement>(
        focusableSelector,
      );

    const firstFocusable =
      focusables?.[0];

    firstFocusable?.focus();

    if (!firstFocusable) {
      container?.focus();
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (
        event.key !== 'Tab' ||
        !container
      ) {
        return;
      }

      const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
          focusableSelector,
        ),
      );

      if (elements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = elements[0];
      const last =
        elements[
          elements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last?.focus();
        return;
      }

      if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      previousActiveElement?.focus();
    };
  }, [
    containerRef,
    onClose,
    open,
  ]);
}
