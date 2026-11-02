type LogLevel =
  | 'info'
  | 'warn'
  | 'error';

type LogFields = Record<string, unknown>;

function writeLog(
  level: LogLevel,
  message: string,
  fields?: LogFields,
) {
  const entry = {
    ...fields,
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  const output = JSON.stringify(entry);

  if (level === 'warn') {
    console.warn(output);
    return;
  }

  if (level === 'error') {
    console.error(output);
    return;
  }

  console.log(output);
}

export function serializeError(
  error: unknown,
) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: 'Unknown error',
  };
}

export const logger = {
  info(
    message: string,
    fields?: LogFields,
  ) {
    writeLog('info', message, fields);
  },

  warn(
    message: string,
    fields?: LogFields,
  ) {
    writeLog('warn', message, fields);
  },

  error(
    message: string,
    fields?: LogFields,
  ) {
    writeLog('error', message, fields);
  },
};
