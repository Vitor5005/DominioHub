import {
  type FormEvent,
  useState,
} from 'react';

import {
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  Button,
  IconButton,
  Input,
  Modal,
  Select,
  useToast,
} from '../ui';

import type {
  Role,
} from '../../features/auth/types';

import {
  getCreateUserError,
  type UserMutationError,
} from '../../features/users/user-errors';

import type {
  CreateUserInput,
  UserRecord,
} from '../../features/users/types';

interface CreateUserModalProps {
  open: boolean;

  onClose(): void;

  onCreate(
    input: CreateUserInput,
  ): Promise<UserRecord>;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const initialForm:
  CreateUserForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SUPPORT',
  };

function validateForm(
  form: CreateUserForm,
): UserMutationError | null {
  const fieldErrors:
    UserMutationError['fieldErrors'] =
      {};

  const name =
    form.name.trim();

  const email =
    form.email.trim();

  if (
    name.length < 2 ||
    name.length > 100
  ) {
    fieldErrors.name =
      'O nome deve ter entre 2 e 100 caracteres.';
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      email,
    )
  ) {
    fieldErrors.email =
      'Informe um e-mail válido.';
  }

  if (
    form.password.length < 8 ||
    form.password.length > 128
  ) {
    fieldErrors.password =
      'A senha deve ter entre 8 e 128 caracteres.';
  }

  if (
    form.confirmPassword !==
    form.password
  ) {
    fieldErrors.confirmPassword =
      'As senhas não coincidem.';
  }

  if (
    Object.keys(
      fieldErrors,
    ).length === 0
  ) {
    return null;
  }

  return {
    message:
      'Revise os campos destacados.',

    requestId: null,
    fieldErrors,
  };
}

export function CreateUserModal({
  open,
  onClose,
  onCreate,
}: CreateUserModalProps) {
  const { toast } =
    useToast();

  const [
    form,
    setForm,
  ] =
    useState<CreateUserForm>(
      initialForm,
    );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    mutationError,
    setMutationError,
  ] =
    useState<UserMutationError | null>(
      null,
    );

  function resetForm() {
    setForm(initialForm);
    setShowPassword(false);
    setMutationError(null);
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError =
      validateForm(form);

    if (validationError) {
      setMutationError(
        validationError,
      );

      return;
    }

    setSubmitting(true);
    setMutationError(null);

    try {
      const createdUser =
        await onCreate({
          name:
            form.name.trim(),

          email:
            form.email
              .trim()
              .toLowerCase(),

          password:
            form.password,

          role:
            form.role,
        });

      toast({
        tone: 'success',

        title:
          'Usuário criado',

        description:
          `${createdUser.name} foi adicionado à organização.`,
      });

      resetForm();
      onClose();
    } catch (error) {
      setMutationError(
        getCreateUserError(
          error,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function clearError() {
    if (mutationError) {
      setMutationError(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo usuário"
      description="Adicione um usuário à organização e defina seu nível de acesso."
      footer={
        <>
          <Button
            variant="secondary"
            disabled={submitting}
            onClick={
              handleClose
            }
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="create-user-form"
            loading={submitting}
          >
            Criar usuário
          </Button>
        </>
      }
    >
      <form
        id="create-user-form"
        className="users-form"
        onSubmit={
          handleSubmit
        }
        noValidate
      >
        <Input
          label="Nome"
          autoFocus
          required
          maxLength={100}
          value={form.name}
          error={
            mutationError
              ?.fieldErrors
              .name
          }
          placeholder="Nome completo"
          onChange={(event) => {
            clearError();

            setForm(
              (current) => ({
                ...current,

                name:
                  event.target
                    .value,
              }),
            );
          }}
        />

        <Input
          label="E-mail"
          type="email"
          autoComplete="off"
          required
          value={form.email}
          error={
            mutationError
              ?.fieldErrors
              .email
          }
          placeholder="usuario@empresa.com"
          onChange={(event) => {
            clearError();

            setForm(
              (current) => ({
                ...current,

                email:
                  event.target
                    .value,
              }),
            );
          }}
        />

        <Input
          label="Senha"
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          autoComplete="new-password"
          required
          maxLength={128}
          value={form.password}
          error={
            mutationError
              ?.fieldErrors
              .password
          }
          hint="Use pelo menos 8 caracteres."
          trailingElement={
            <IconButton
              variant="ghost"
              aria-label={
                showPassword
                  ? 'Ocultar senha'
                  : 'Mostrar senha'
              }
              title={
                showPassword
                  ? 'Ocultar senha'
                  : 'Mostrar senha'
              }
              icon={
                showPassword ? (
                  <EyeOff
                    size={17}
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    size={17}
                    aria-hidden="true"
                  />
                )
              }
              onClick={() => {
                setShowPassword(
                  (current) =>
                    !current,
                );
              }}
            />
          }
          onChange={(event) => {
            clearError();

            setForm(
              (current) => ({
                ...current,

                password:
                  event.target
                    .value,
              }),
            );
          }}
        />

        <Input
          label="Confirmar senha"
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          autoComplete="new-password"
          required
          maxLength={128}
          value={
            form.confirmPassword
          }
          error={
            mutationError
              ?.fieldErrors
              .confirmPassword
          }
          placeholder="Digite a senha novamente"
          onChange={(event) => {
            clearError();

            setForm(
              (current) => ({
                ...current,

                confirmPassword:
                  event.target
                    .value,
              }),
            );
          }}
        />

        <Select
          label="Função"
          value={form.role}
          onChange={(event) => {
            clearError();

            setForm(
              (current) => ({
                ...current,

                role:
                  event.target
                    .value as Role,
              }),
            );
          }}
        >
          <option value="ADMIN">
            Administrador
          </option>

          <option value="OPERATOR">
            Operador
          </option>

          <option value="SUPPORT">
            Suporte
          </option>
        </Select>

        {mutationError && (
          <div
            className="users-form-error"
            role="alert"
          >
            <strong>
              {
                mutationError
                  .message
              }
            </strong>

            {mutationError.requestId && (
              <span>
                Código de suporte:{' '}
                <code>
                  {
                    mutationError
                      .requestId
                  }
                </code>
              </span>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}