import {
  AppError,
} from '../../common/errors/app-error.js';

export class DomainNotFoundError
  extends AppError
{
  constructor() {
    super(
      404,
      'DOMAIN_NOT_FOUND',
      'Domain not found.',
    );
  }
}

export class DomainProviderError
  extends AppError
{
  constructor() {
    super(
      502,
      'DOMAIN_PROVIDER_ERROR',
      'Unable to retrieve domains from provider.',
    );
  }
}
