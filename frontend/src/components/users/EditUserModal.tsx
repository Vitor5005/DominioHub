import {
  type FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Input,
  Modal,
  Select,
  useToast,
} from '../ui';

import type {
  Role,
} from '../../features/auth/types';

import {
  getUpdateUserError,
  type UserMutationError,
} from '../../features/users/user-errors';

import type {
  UpdateUserInput,
  UserRecord,
} from '../../features/users/types';

interface EditUserModalProps {
  user: UserRecord;
  currentUserId: string;

  onClose(): void;

  onUpdate(
    userId: string,
    input: UpdateUserInput,
  ): Promise<UserRecord>;

  onUpdated?(
    user: UserRecord,
  ): void;
}

export function EditUserModal({
  user,
  currentUserId,
  onClose,
  onUpdate,
  onUpdated,
}: EditUserModalProps) {
  const { toast } =
    useToast();

  const [
    name,
    setName,
  ] =
    useState(
      user.name,
    );

  const [
    role,
    setRole,
  ] =
    useState<Role>(
      user.role,
    );

  const [
    active,
    setActive,
  ] =
    useState(
      user.active,
    );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    confirmDeactivate,
    setConfirmDeactivate,
  ] = useState(false);

  const [
    mutationError,
    setMutationError,
  ] =
    useState<UserMutationError | null>(
      null,
    );

  const isSelf =
    user.id ===
    currentUserId;

  const normalizedName =
    name.trim();

  const hasChanges =
    useMemo(
      () =>
        normalizedName !==
          user.name ||
        role !==
          user.role ||
        active !==
          user.active,
      [
        active,
        normalizedName,
        role,
        user.active,
        user.name,
        user.role,
      ],
    );

  function handleClose() {
    if (saving) {
      return;
    }

    onClose();
  }

  function validateName() {
    if (
      normalizedName.length <
        2 ||
      normalizedName.length >
        100
    ) {
      setMutationError({
        message:
          'Revise os campos destacados.',

        requestId: null,

        fieldErrors: {
          name:
            'O nome deve ter entre 2 e 100 caracteres.',
        },
      });

      return false;
    }

    return true;
  }

  async function persistUpdate() {
    if (
      !validateName()
    ) {
      return;
    }

    const input:
      UpdateUserInput = {};

    if (
      normalizedName !==
      user.name
    ) {
      input.name =
        normalizedName;
    }

    if (
      role !== user.role
    ) {
      input.role = role;
    }

    if (
      active !==
      user.active
    ) {
      input.active =
        active;
    }

    if (
      Object.keys(
        input,
      ).length === 0
    ) {
      return;
    }

    setSaving(true);
    setMutationError(null);

    try {
      const updatedUser =
        await onUpdate(
          user.id,
          input,
        );

      toast({
        tone: 'success',

        title:
          'Usuário atualizado',

        description:
          `${updatedUser.name} foi atualizado com sucesso.`,
      });

      onClose();

      onUpdated?.(
        updatedUser,
      );
    } catch (error) {
      setMutationError(
        getUpdateUserError(
          error,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !hasChanges ||
      saving
    ) {
      return;
    }

    if (
      user.active &&
      !active
    ) {
      setConfirmDeactivate(
        true,
      );

      return;
    }

    await persistUpdate();
  }

  return (
    <>
      <Modal
        open={!confirmDeactivate}
        onClose={handleClose}
        title="Editar usuário"
        description="Atualize os dados e o nível de acesso do usuário."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={
                handleClose
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              form="edit-user-form"
              loading={saving}
              disabled={
                !hasChanges
              }
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        <form
          id="edit-user-form"
          className="users-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <Input
            label="Nome"
            required
            maxLength={100}
            value={name}
            error={
              mutationError
                ?.fieldErrors
                .name
            }
            onChange={(event) => {
              setMutationError(
                null,
              );

              setName(
                event.target
                  .value,
              );
            }}
          />

          <Input
            label="E-mail"
            type="email"
            value={user.email}
            disabled
            hint="O e-mail não pode ser alterado."
          />

          <div
            title={
              isSelf
                ? 'Você não pode remover o próprio acesso de administrador.'
                : undefined
            }
          >
            <Select
              label="Função"
              value={role}
              disabled={isSelf}
              onChange={(event) => {
                setMutationError(
                  null,
                );

                setRole(
                  event.target
                    .value as Role,
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
          </div>

          <label
            className={
              `users-toggle${
                isSelf
                  ? ' users-toggle--disabled'
                  : ''
              }`
            }
            title={
              isSelf
                ? 'Você não pode desativar a própria conta.'
                : undefined
            }
          >
            <input
              type="checkbox"
              checked={active}
              disabled={isSelf}
              onChange={(event) => {
                setMutationError(
                  null,
                );

                setActive(
                  event.target
                    .checked,
                );
              }}
            />

            <span
              className="users-toggle__track"
              aria-hidden="true"
            />

            <span className="users-toggle__content">
              <strong>
                Usuário ativo
              </strong>

              <span>
                Usuários inativos não podem acessar o DomínioHub.
              </span>
            </span>
          </label>

          {isSelf && (
            <div className="users-self-protection">
              Você pode alterar seu nome, mas não pode desativar sua própria conta nem remover seu acesso de administrador.
            </div>
          )}

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

      <Modal
        open={
          confirmDeactivate
        }
        onClose={() => {
          if (!saving) {
            setConfirmDeactivate(
              false,
            );
          }
        }}
        title="Desativar usuário?"
        description="Esta ação impede novos acessos à conta."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setConfirmDeactivate(
                  false,
                );
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              loading={saving}
              onClick={() => {
                setConfirmDeactivate(
                  false,
                );

                void persistUpdate();
              }}
            >
              Desativar usuário
            </Button>
          </>
        }
      >
        <p className="users-confirm-text">
          <strong>
            {user.name}
          </strong>{' '}
          perderá o acesso ao DomínioHub. A conta poderá ser reativada posteriormente.
        </p>
      </Modal>
    </>
  );
}
