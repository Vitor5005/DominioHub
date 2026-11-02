import {
  AppError,
} from '../../common/errors/app-error.js';

export class InvalidEventCredentialsError
  extends AppError
{
  constructor() {
    super(
      401,
      'INVALID_EVENT_CREDENTIALS',
      'Invalid event credentials.',
    );
  }
}

export class EventNotFoundError
  extends AppError
{
  constructor() {
    super(
      404,
      'EVENT_NOT_FOUND',
      'Event not found.',
    );
  }
}

export class EventQueueUnavailableError
  extends AppError
{
  constructor() {
    super(
      503,
      'EVENT_QUEUE_UNAVAILABLE',
      'Event was received but could not be queued for processing.',
    );
  }
}
