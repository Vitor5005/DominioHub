import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import {
  IconButton,
} from './IconButton';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange(
    page: number,
  ): void;

  onPageSizeChange(
    pageSize: number,
  ): void;

  pageSizeOptions?:
    readonly number[];
}

const defaultPageSizeOptions = [
  10,
  25,
  50,
] as const;

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions =
    defaultPageSizeOptions,
}: PaginationProps) {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
          pageSize,
      ),
    );

  const safePage =
    Math.min(
      Math.max(
        page,
        1,
      ),
      totalPages,
    );

  const firstItem =
    totalItems === 0
      ? 0
      : (
          safePage - 1
        ) *
          pageSize +
        1;

  const lastItem =
    Math.min(
      safePage *
        pageSize,
      totalItems,
    );

  return (
    <nav
      className="ui-pagination"
      aria-label="Paginação"
    >
      <div
        className="ui-pagination__summary"
        aria-live="polite"
        aria-atomic="true"
      >
        {firstItem}
        {'–'}
        {lastItem}
        {' de '}
        {totalItems}
      </div>

      <div className="ui-pagination__size">
        <span>
          Itens por página
        </span>

        <select
          aria-label="Itens por página"
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(
              Number(
                event.target
                  .value,
              ),
            );
          }}
        >
          {pageSizeOptions.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="ui-pagination__controls">
        <IconButton
          variant="ghost"
          aria-label="Página anterior"
          title="Página anterior"
          disabled={
            safePage <= 1
          }
          icon={
            <ChevronLeft
              size={17}
              aria-hidden="true"
            />
          }
          onClick={() => {
            onPageChange(
              safePage - 1,
            );
          }}
        />

        <span>
          Página {safePage}{' '}
          de {totalPages}
        </span>

        <IconButton
          variant="ghost"
          aria-label="Próxima página"
          title="Próxima página"
          disabled={
            safePage >=
            totalPages
          }
          icon={
            <ChevronRight
              size={17}
              aria-hidden="true"
            />
          }
          onClick={() => {
            onPageChange(
              safePage + 1,
            );
          }}
        />
      </div>
    </nav>
  );
}
