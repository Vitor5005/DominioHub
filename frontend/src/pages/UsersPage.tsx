import {
  type KeyboardEvent,
  useMemo,
  useState,
} from 'react';

import {
  Plus,
  RefreshCw,
  Search,
  Users as UsersIcon,
  ChevronRight,
} from 'lucide-react';

import {
  PageHeader,
} from '../components/layout/PageHeader';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui';

import {
  CreateUserModal,
} from '../components/users/CreateUserModal';

import {
  EditUserModal,
} from '../components/users/EditUserModal';

import {
  useAuth,
} from '../features/auth/useAuth';

import type {
  Role,
} from '../features/auth/types';

import type {
  UserRecord,
} from '../features/users/types';

import {
  useUsersData,
} from '../features/users/useUsersData';

const roleLabels:
  Record<
    Role,
    string
  > = {
    ADMIN:
      'Administrador',

    OPERATOR:
      'Operador',

    SUPPORT:
      'Suporte',
  };

function getRoleTone(
  role: Role,
) {
  if (
    role === 'ADMIN'
  ) {
    return 'indigo' as const;
  }

  if (
    role === 'OPERATOR'
  ) {
    return 'info' as const;
  }

  return 'neutral' as const;
}

function UsersLoading() {
  return (
    <Card
      padding="none"
      className="users-card"
    >
      <div className="users-toolbar">
        <Skeleton
          width={340}
          height={40}
          radius={8}
        />

        <Skeleton
          width={90}
          height={14}
        />
      </div>

      <div className="users-loading">
        {Array.from(
          {
            length: 6,
          },
          (_, index) => (
            <div
              key={index}
              className="users-loading__row"
            >
              <div>
                <Skeleton
                  width={180}
                />

                <Skeleton
                  width={145}
                  height={12}
                />
              </div>

              <Skeleton
                width={90}
                height={24}
                radius={999}
              />

              <Skeleton
                width={64}
                height={24}
                radius={999}
              />
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

export function UsersPage() {
  const {
    user:
      currentUser,

    hasPermission,
    refreshSession,
  } = useAuth();

  const {
    users,
    status,
    error,
    refresh,
    createUser,
    updateUser,
  } =
    useUsersData();

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<UserRecord | null>(
      null,
    );

  const canManage =
    hasPermission(
      'users:manage',
    );

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          user.name
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(query) ||
          user.email
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(query),
      );
    }, [
      search,
      users,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredUsers.length /
          pageSize,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const visibleUsers =
    filteredUsers.slice(
      (
        safePage - 1
      ) *
        pageSize,

      safePage *
        pageSize,
    );

  function openUser(
    user: UserRecord,
  ) {
    if (!canManage) {
      return;
    }

    setSelectedUser(
      user,
    );
  }

  function handleRowKeyDown(
    event:
      KeyboardEvent,
    user: UserRecord,
  ) {
    if (!canManage) {
      return;
    }

    if (
      event.key ===
        'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();

      openUser(user);
    }
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários e níveis de acesso da organização."
        action={
          canManage ? (
            <Button
              className="users-new-button"
              leadingIcon={
                <Plus
                  size={16}
                  aria-hidden="true"
                />
              }
              onClick={() => {
                setCreateOpen(
                  true,
                );
              }}
            >
              Novo usuário
            </Button>
          ) : undefined
        }
      />

      {status ===
      'error' ? (
        <ErrorState
          title="Não foi possível carregar os usuários"
          description={
            error?.message ??
            'Não foi possível carregar os usuários.'
          }
          requestId={
            error?.requestId
          }
          action={
            <Button
              variant="secondary"
              leadingIcon={
                <RefreshCw
                  size={16}
                  aria-hidden="true"
                />
              }
              onClick={() => {
                void refresh();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : status ===
        'loading' ? (
        <UsersLoading />
      ) : (
        <Card
          padding="none"
          className="users-card"
        >
          <div className="users-toolbar">
            <div className="users-search">
              <Input
                label="Buscar usuários"
                value={search}
                placeholder="Buscar por nome ou e-mail..."
                leadingIcon={
                  <Search
                    size={16}
                    aria-hidden="true"
                  />
                }
                onChange={(event) => {
                  setSearch(
                    event.target
                      .value,
                  );

                  setPage(1);
                }}
              />
            </div>

            <span className="users-count">
              {
                filteredUsers.length
              }{' '}
              {filteredUsers.length ===
              1
                ? 'usuário'
                : 'usuários'}
            </span>
          </div>

          {filteredUsers.length ===
          0 ? (
            search.trim() ? (
              <EmptyState
                icon={
                  <Search
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum usuário encontrado"
                description="Nenhum usuário corresponde à busca informada."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                  >
                    Limpar busca
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={
                  <UsersIcon
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum usuário cadastrado"
                description="Adicione usuários para conceder acesso à organização."
                action={
                  canManage ? (
                    <Button
                      leadingIcon={
                        <Plus
                          size={16}
                          aria-hidden="true"
                        />
                      }
                      onClick={() => {
                        setCreateOpen(
                          true,
                        );
                      }}
                    >
                      Novo usuário
                    </Button>
                  ) : undefined
                }
              />
            )
          ) : (
            <>
              <div className="users-desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Nome
                      </TableHead>

                      <TableHead>
                        E-mail
                      </TableHead>

                      <TableHead>
                        Função
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead
                        aria-label="Ações"
                      />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visibleUsers.map(
                      (user) => (
                        <TableRow
                          key={
                            user.id
                          }
                          className={
                            canManage
                              ? 'users-table-row--interactive'
                              : undefined
                          }
                          tabIndex={
                            canManage
                              ? 0
                              : undefined
                          }
                          aria-label={
                            canManage
                              ? `Editar usuário ${user.name}`
                              : undefined
                          }
                          onClick={
                            canManage
                              ? () => {
                                  openUser(
                                    user,
                                  );
                                }
                              : undefined
                          }
                          onKeyDown={
                            canManage
                              ? (
                                  event,
                                ) => {
                                  handleRowKeyDown(
                                    event,
                                    user,
                                  );
                                }
                              : undefined
                          }
                        >
                          <TableCell>
                            <div className="users-name-cell">
                              <strong>
                                {
                                  user.name
                                }
                              </strong>

                              {user.id ===
                                currentUser?.id && (
                                <Badge tone="indigo">
                                  Você
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {
                              user.email
                            }
                          </TableCell>

                          <TableCell>
                            <Badge
                              tone={
                                getRoleTone(
                                  user.role,
                                )
                              }
                            >
                              {
                                roleLabels[
                                  user.role
                                ]
                              }
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              tone={
                                user.active
                                  ? 'success'
                                  : 'neutral'
                              }
                            >
                              {user.active
                                ? 'Ativo'
                                : 'Inativo'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {canManage && (
                              <ChevronRight
                                className="users-row-chevron"
                                size={16}
                                aria-hidden="true"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="users-mobile-list">
                {visibleUsers.map(
                  (user) => (
                    <button
                      key={
                        user.id
                      }
                      type="button"
                      className="users-mobile-card"
                      disabled={
                        !canManage
                      }
                      onClick={() => {
                        openUser(
                          user,
                        );
                      }}
                    >
                      <div className="users-mobile-card__content">
                        <div className="users-mobile-card__name">
                          <strong>
                            {
                              user.name
                            }
                          </strong>

                          {user.id ===
                            currentUser?.id && (
                            <Badge tone="indigo">
                              Você
                            </Badge>
                          )}
                        </div>

                        <span>
                          {
                            user.email
                          }
                        </span>

                        <div className="users-mobile-card__badges">
                          <Badge
                            tone={
                              getRoleTone(
                                user.role,
                              )
                            }
                          >
                            {
                              roleLabels[
                                user.role
                              ]
                            }
                          </Badge>

                          <Badge
                            tone={
                              user.active
                                ? 'success'
                                : 'neutral'
                            }
                          >
                            {user.active
                              ? 'Ativo'
                              : 'Inativo'}
                          </Badge>
                        </div>
                      </div>

                      {canManage && (
                        <ChevronRight
                          size={18}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ),
                )}
              </div>

              <Pagination
                page={safePage}
                pageSize={
                  pageSize
                }
                totalItems={
                  filteredUsers.length
                }
                onPageChange={
                  setPage
                }
                onPageSizeChange={(
                  nextPageSize,
                ) => {
                  setPageSize(
                    nextPageSize,
                  );

                  setPage(1);
                }}
              />
            </>
          )}
        </Card>
      )}

      <CreateUserModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(
            false,
          );
        }}
        onCreate={
          createUser
        }
      />

      {selectedUser && (
        <EditUserModal
          key={
            selectedUser.id
          }
          user={
            selectedUser
          }
          currentUserId={
            currentUser?.id ??
            ''
          }
          onClose={() => {
            setSelectedUser(
              null,
            );
          }}
          onUpdate={
            updateUser
          }
          onUpdated={(
            updatedUser,
          ) => {
            if (
              updatedUser.id ===
              currentUser?.id
            ) {
              void refreshSession();
            }
          }}
        />
      )}
    </>
  );
}
