import type {
  CSSProperties,
} from 'react';

import { cn } from '../../lib/cn';

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'ui-skeleton',
        className,
      )}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    />
  );
}
