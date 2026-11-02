import {
  AppError,
} from '../../common/errors/app-error.js';

export class UserNotFoundError
  extends AppError
{
  constructor() {
    super(
      404,
      'USER_NOT_FOUND',
      'User not found.',
    );
  }
}

export class UserEmailAlreadyExistsError
  extends AppError
{
  constructor() {
    super(
      409,
      'EMAIL_ALREADY_EXISTS',
      'A user with this email already exists.',
    );
  }
}

export class UserSelfProtectionError
  extends AppError
{
  constructor() {
    super(
      409,
      'SELF_PROTECTION',
      'You cannot deactivate or remove your own administrator access.',
    );
  }
}
