import {
  ApiError,
} from '../../services/api-client';

export type UserFormField =
  | 'name'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'role'
  | 'active';

export interface UserMutationError {
  message: string;

  requestId:
    | string
    | null;

  fieldErrors: Partial<
    Record<
      UserFormField,
      string
    >
  >;
}

const validationMessages: Partial<
  Record<
    UserFormField,
    string
  >
> = {
  name:
    'O nome deve ter entre 2 e 100 caracteres.',

  email:
    'Informe um e-mail válido.',

  password:
    'A senha deve ter entre 8 e 128 caracteres.',

  role:
    'Selecione uma função válida.',

  active:
    'Selecione um status válido.',
};

function hasFieldError(
  details: unknown,
  field: string,
) {
  if (
    typeof details !== 'object' ||
    details === null
  ) {
    return false;
  }

  const value = (
    details as Record<
      string,
      unknown
    >
  )[field];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined;
}

function getValidationErrors(
  error: ApiError,
) {
  const fieldErrors:
    UserMutationError['fieldErrors'] =
      {};

  const fields:
    UserFormField[] = [
      'name',
      'email',
      'password',
      'role',
      'active',
    ];

  for (const field of fields) {
    if (
      hasFieldError(
        error.details,
        field,
      )
    ) {
      fieldErrors[field] =
        validationMessages[field];
    }
  }

  return fieldErrors;
}

function getCommonError(
  error: unknown,
): UserMutationError | null {
  if (
    !(error instanceof ApiError)
  ) {
    return {
      message:
        'Não foi possível concluir a operação. Tente novamente.',

      requestId: null,
      fieldErrors: {},
    };
  }

  if (
    error.statusCode === 0
  ) {
    return {
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',

      requestId: null,
      fieldErrors: {},
    };
  }

  if (
    error.statusCode === 429
  ) {
    return {
      message:
        'Muitas solicitações foram realizadas. Aguarde alguns instantes e tente novamente.',

      requestId:
        error.requestId,

      fieldErrors: {},
    };
  }

  if (
    error.statusCode >= 500
  ) {
    return {
      message:
        'O DomínioHub está temporariamente indisponível. Tente novamente em instantes.',

      requestId:
        error.requestId,

      fieldErrors: {},
    };
  }

  return null;
}

export function getCreateUserError(
  error: unknown,
): UserMutationError {
  const common =
    getCommonError(error);

  if (common) {
    return common;
  }

  if (
    error instanceof ApiError
  ) {
    if (
      error.statusCode === 409 &&
      error.code ===
        'EMAIL_ALREADY_EXISTS'
    ) {
      return {
        message:
          'Já existe um usuário cadastrado com este e-mail.',

        requestId:
          error.requestId,

        fieldErrors: {
          email:
            'Este e-mail já está em uso.',
        },
      };
    }

    if (
      error.statusCode === 400 &&
      error.code ===
        'VALIDATION_ERROR'
    ) {
      return {
        message:
          'Revise os campos destacados.',

        requestId:
          error.requestId,

        fieldErrors:
          getValidationErrors(
            error,
          ),
      };
    }

    return {
      message:
        error.message ||
        'Não foi possível criar o usuário.',

      requestId:
        error.requestId,

      fieldErrors: {},
    };
  }

  return {
    message:
      'Não foi possível criar o usuário.',

    requestId: null,
    fieldErrors: {},
  };
}

export function getUpdateUserError(
  error: unknown,
): UserMutationError {
  const common =
    getCommonError(error);

  if (common) {
    return common;
  }

  if (
    error instanceof ApiError
  ) {
    if (
      error.statusCode === 409 &&
      error.code ===
        'SELF_PROTECTION'
    ) {
      return {
        message:
          'Você não pode desativar nem remover o próprio acesso de administrador.',

        requestId:
          error.requestId,

        fieldErrors: {},
      };
    }

    if (
      error.statusCode === 404 &&
      error.code ===
        'USER_NOT_FOUND'
    ) {
      return {
        message:
          'O usuário não foi encontrado. Atualize a lista e tente novamente.',

        requestId:
          error.requestId,

        fieldErrors: {},
      };
    }

    if (
      error.statusCode === 400 &&
      error.code ===
        'VALIDATION_ERROR'
    ) {
      return {
        message:
          'Revise os campos destacados.',

        requestId:
          error.requestId,

        fieldErrors:
          getValidationErrors(
            error,
          ),
      };
    }

    return {
      message:
        error.message ||
        'Não foi possível atualizar o usuário.',

      requestId:
        error.requestId,

      fieldErrors: {},
    };
  }

  return {
    message:
      'Não foi possível atualizar o usuário.',

    requestId: null,
    fieldErrors: {},
  };
}