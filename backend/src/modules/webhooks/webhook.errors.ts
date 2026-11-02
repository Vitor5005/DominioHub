import {
  AppError,
} from '../../common/errors/app-error.js';

export class WebhookEndpointNotFoundError
  extends AppError
{
  constructor() {
    super(
      404,
      'WEBHOOK_ENDPOINT_NOT_FOUND',
      'Webhook endpoint not found.',
    );
  }
}

export class WebhookUrlNotAllowedError
  extends AppError
{
  constructor() {
    super(
      400,
      'WEBHOOK_URL_NOT_ALLOWED',
      'Webhook URL is not allowed.',
    );
  }
}
