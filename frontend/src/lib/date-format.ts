const dateFormatter =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

function parseDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

export function formatDate(
  value: string | null,
) {
  if (!value) {
    return '—';
  }

  const date =
    parseDate(value);

  if (!date) {
    return '—';
  }

  return dateFormatter.format(
    date,
  );
}

export function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return '—';
  }

  const date =
    parseDate(value);

  if (!date) {
    return '—';
  }

  return dateTimeFormatter.format(
    date,
  );
}
