import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

import { cn } from '../../lib/cn';

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ui-table-wrapper">
      <table
        {...props}
        className={cn(
          'ui-table',
          className,
        )}
      />
    </div>
  );
}

export function TableHeader(
  props: HTMLAttributes<HTMLTableSectionElement>,
) {
  return <thead {...props} />;
}

export function TableBody(
  props: HTMLAttributes<HTMLTableSectionElement>,
) {
  return <tbody {...props} />;
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn(
        'ui-table__row',
        className,
      )}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        'ui-table__head',
        className,
      )}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={cn(
        'ui-table__cell',
        className,
      )}
    />
  );
}

interface TableEmptyRowProps
  extends TdHTMLAttributes<HTMLTableCellElement> {
  colSpan: number;
}

export function TableEmptyRow({
  colSpan,
  children,
  ...props
}: TableEmptyRowProps) {
  return (
    <tr>
      <td
        {...props}
        colSpan={colSpan}
        className="ui-table__empty"
      >
        {children}
      </td>
    </tr>
  );
}
