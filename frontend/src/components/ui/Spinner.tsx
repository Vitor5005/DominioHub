import { cn } from '../../lib/cn';

type SpinnerSize =
  | 'sm'
  | 'md'
  | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({
  size = 'md',
  label = 'Carregando',
  className,
}: SpinnerProps) {
  return (
    <span
      className={cn(
        'ui-spinner',
        `ui-spinner--${size}`,
        className,
      )}
      role="status"
      aria-label={label}
    />
  );
}
