import {
  AppError,
} from '../../common/errors/app-error.js';

export class InvalidCredentialsError
  extends AppError
{
  constructor() {
    super(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.',
    );
  }
}

export class AccountInactiveError
  extends AppError
{
  constructor() {
    super(
      403,
      'ACCOUNT_INACTIVE',
      'This account is inactive.',
    );
  }
}
