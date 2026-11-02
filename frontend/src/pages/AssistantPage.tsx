import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CircleAlert,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  PageHeader,
} from '../components/layout/PageHeader';

import {
  Button,
  Card,
  Input,
  Skeleton,
  Spinner,
} from '../components/ui';

import {
  chatApi,
} from '../features/chat/chat-api';

import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from '../features/chat/types';

import {
  formatDateTime,
} from '../lib/date-format';

import {
  ApiError,
} from '../services/api-client';

interface ChatError {
  message: string;
  requestId: string | null;
}

const suggestions = [
  'Como funcionam os webhooks no DomínioHub?',
  'O que significam os status dos eventos?',
  'Como posso organizar melhor meus domínios?',
];

function getConversationTitle(
  conversation: ConversationSummary,
) {
  const title =
    conversation.title?.trim();

  return title ||
    'Conversa sem título';
}

function buildConversationTitle(
  message: string,
) {
  const normalized =
    message
      .replace(/\s+/g, ' ')
      .trim();

  if (
    normalized.length <= 72
  ) {
    return normalized;
  }

  return `${normalized
  .slice(0, 69)
  .trimEnd()}...`;
}

function getChatError(
  error: unknown,
): ChatError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível concluir a operação.',
      requestId: null,
    };
  }

  if (error.statusCode === 0) {
    return {
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      requestId: null,
    };
  }

  if (
    error.statusCode === 404 &&
    error.code ===
      'CONVERSATION_NOT_FOUND'
  ) {
    return {
      message:
        'Esta conversa não foi encontrada ou não pertence à sua organização.',
      requestId:
        error.requestId,
    };
  }

  if (
    error.statusCode === 429 ||
    error.code ===
      'RATE_LIMIT_EXCEEDED'
  ) {
    return {
      message:
        'Muitas mensagens foram enviadas em pouco tempo. Aguarde um momento antes de tentar novamente.',
      requestId:
        error.requestId,
    };
  }

  if (
    error.statusCode === 502 ||
    error.code ===
      'AI_PROVIDER_ERROR'
  ) {
    return {
      message:
        'O Assistente IA está temporariamente indisponível. Tente novamente em instantes.',
      requestId:
        error.requestId,
    };
  }

  if (error.statusCode === 403) {
    return {
      message:
        'Sua conta não possui permissão para utilizar o Assistente IA.',
      requestId:
        error.requestId,
    };
  }

  if (error.statusCode >= 500) {
    return {
      message:
        'O DomínioHub está temporariamente indisponível. Tente novamente em instantes.',
      requestId:
        error.requestId,
    };
  }

  return {
    message:
      error.message ||
      'Não foi possível concluir a operação.',
    requestId:
      error.requestId,
  };
}

function sortConversations(
  conversations:
    ConversationSummary[],
) {
  return [
    ...conversations,
  ].sort(
    (
      first,
      second,
    ) =>
      new Date(
        second.updatedAt,
      ).getTime() -
      new Date(
        first.updatedAt,
      ).getTime(),
  );
}

export function AssistantPage() {
  const {
    conversationId,
  } =
    useParams<{
      conversationId: string;
    }>();

  const navigate =
    useNavigate();

  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    );

  const messagesEndRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    conversations,
    setConversations,
  ] =
    useState<
      ConversationSummary[]
    >([]);

  const [
    listStatus,
    setListStatus,
  ] =
    useState<
      'loading' |
      'success' |
      'error'
    >('loading');

  const [
    listError,
    setListError,
  ] =
    useState<ChatError | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    conversation,
    setConversation,
  ] =
    useState<ConversationDetail | null>(
      null,
    );

  const [
    conversationStatus,
    setConversationStatus,
  ] =
    useState<
      'idle' |
      'loading' |
      'success' |
      'error'
    >(
      conversationId
        ? 'loading'
        : 'idle',
    );

  const [
    conversationError,
    setConversationError,
  ] =
    useState<ChatError | null>(
      null,
    );

  const [
    composer,
    setComposer,
  ] = useState('');

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    sendError,
    setSendError,
  ] =
    useState<ChatError | null>(
      null,
    );

  const [
    pendingMessage,
    setPendingMessage,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      try {
        const response =
          await chatApi.listConversations();

        if (cancelled) {
          return;
        }

        setConversations(
          response.conversations,
        );

        setListError(null);
        setListStatus(
          'success',
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setListError(
          getChatError(error),
        );

        setListStatus(
          'error',
        );
      }
    }

    void loadList();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncConversation() {
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      if (!conversationId) {
        setConversation(null);

        setConversationStatus(
          'idle',
        );

        setConversationError(
          null,
        );

        return;
      }

      const currentConversationId =
        conversationId;

      setConversationStatus(
        'loading',
      );

      setConversationError(null);

      try {
        const response =
          await chatApi.getConversation(
            currentConversationId,
          );

        if (cancelled) {
          return;
        }

        setConversation(
          response.conversation,
        );

        setConversationError(
          null,
        );

        setConversationStatus(
          'success',
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setConversation(null);

        setConversationError(
          getChatError(error),
        );

        setConversationStatus(
          'error',
        );
      }
    }

    void syncConversation();

    return () => {
      cancelled = true;
    };
  }, [
    conversationId,
  ]);

  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
  }, [
    conversation?.messages.length,
    pendingMessage,
    sending,
  ]);

  const filteredConversations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (item) =>
          getConversationTitle(
            item,
          )
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(query),
      );
    }, [
      conversations,
      search,
    ]);

  const visibleMessages =
    useMemo(
      () =>
        conversation?.messages.filter(
          (message) =>
            message.role !==
            'SYSTEM',
        ) ?? [],
      [
        conversation,
      ],
    );

  const trimmedComposer =
    composer.trim();

  const canSend =
    trimmedComposer.length > 0 &&
    trimmedComposer.length <= 4000 &&
    !sending &&
    (
      !conversationId ||
      (
        conversationStatus ===
          'success' &&
        conversation !== null
      )
    );

  function updateConversationActivity(
    conversationToUpdate:
      ConversationSummary,
    updatedAt: string,
  ) {
    setConversations(
      (current) =>
        sortConversations(
          current.map(
            (item) =>
              item.id ===
              conversationToUpdate.id
                ? {
                    ...item,
                    updatedAt,
                  }
                : item,
          ),
        ),
    );
  }

  function addConversationToList(
    created:
      ConversationSummary,
  ) {
    setConversations(
      (current) =>
        sortConversations([
          created,
          ...current.filter(
            (item) =>
              item.id !==
              created.id,
          ),
        ]),
    );

    setListStatus(
      'success',
    );

    setListError(null);
  }

  function openNewConversation() {
    if (sending) {
      return;
    }

    setComposer('');
    setSendError(null);
    setPendingMessage(null);

    navigate('/assistant');
  }

  function selectConversation(
    id: string,
  ) {
    if (
      sending ||
      id === conversationId
    ) {
      return;
    }

    setComposer('');
    setSendError(null);
    setPendingMessage(null);

    navigate(
      `/assistant/${id}`,
    );
  }

  async function retryList() {
    setListStatus(
      'loading',
    );

    setListError(null);

    try {
      const response =
        await chatApi.listConversations();

      setConversations(
        response.conversations,
      );

      setListStatus(
        'success',
      );
    } catch (error) {
      setListError(
        getChatError(error),
      );

      setListStatus(
        'error',
      );
    }
  }

  async function retryConversation() {
    if (!conversationId) {
      return;
    }

    setConversationStatus(
      'loading',
    );

    setConversationError(null);

    try {
      const response =
        await chatApi.getConversation(
          conversationId,
        );

      setConversation(
        response.conversation,
      );

      setConversationStatus(
        'success',
      );
    } catch (error) {
      setConversation(null);

      setConversationError(
        getChatError(error),
      );

      setConversationStatus(
        'error',
      );
    }
  }

  async function sendMessage(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const content =
      composer.trim();

    if (
      !content ||
      content.length > 4000 ||
      sending
    ) {
      return;
    }

    if (
      conversationId &&
      (
        conversationStatus !==
          'success' ||
        !conversation
      )
    ) {
      return;
    }

    setSending(true);
    setSendError(null);
    setPendingMessage(content);
    setComposer('');

    try {
      if (
        conversationId &&
        conversation
      ) {
        const response =
          await chatApi.sendMessage(
            conversationId,
            {
              content,
            },
          );

        const updatedAt =
          response.assistantMessage
            .createdAt;

        setConversation(
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              updatedAt,
              messages: [
                ...current.messages,
                response.userMessage,
                response.assistantMessage,
              ],
            };
          },
        );

        updateConversationActivity(
          conversation,
          updatedAt,
        );

        setPendingMessage(null);

        return;
      }

      const createResponse =
        await chatApi.createConversation({
          title:
            buildConversationTitle(
              content,
            ),
        });

      const createdConversation =
        createResponse.conversation;

      addConversationToList(
        createdConversation,
      );

      const messageResponse =
        await chatApi.sendMessage(
          createdConversation.id,
          {
            content,
          },
        );

      const updatedAt =
        messageResponse
          .assistantMessage
          .createdAt;

      const createdDetail:
        ConversationDetail = {
          ...createdConversation,
          updatedAt,
          messages: [
            messageResponse.userMessage,
            messageResponse.assistantMessage,
          ],
        };

      setConversation(
        createdDetail,
      );

      setConversationStatus(
        'success',
      );

      updateConversationActivity(
        createdConversation,
        updatedAt,
      );

      setPendingMessage(null);

      navigate(
        `/assistant/${createdConversation.id}`,
        {
          replace: true,
        },
      );
    } catch (error) {
      setComposer(content);

      setPendingMessage(null);

      setSendError(
        getChatError(error),
      );
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (canSend) {
        event.currentTarget
          .form
          ?.requestSubmit();
      }
    }
  }

  function applySuggestion(
    suggestion: string,
  ) {
    if (sending) {
      return;
    }

    setComposer(
      suggestion,
    );

    setSendError(null);

    requestAnimationFrame(
      () => {
        textareaRef.current
          ?.focus();
      },
    );
  }

  function renderMessage(
    message: ChatMessage,
  ) {
    const isUser =
      message.role === 'USER';

    return (
      <article
        key={message.id}
        className={
          `assistant-message ${
            isUser
              ? 'assistant-message--user'
              : 'assistant-message--assistant'
          }`
        }
      >
        <div className="assistant-message__avatar">
          {isUser ? (
            <UserRound
              size={17}
              aria-hidden="true"
            />
          ) : (
            <Sparkles
              size={17}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="assistant-message__content">
          <div className="assistant-message__meta">
            <strong>
              {isUser
                ? 'Você'
                : 'Assistente IA'}
            </strong>

            <span>
              {formatDateTime(
                message.createdAt,
              )}
            </span>
          </div>

          <p>
            {message.content}
          </p>
        </div>
      </article>
    );
  }

  const showWelcome =
    !conversation &&
    !pendingMessage &&
    !conversationId;

  return (
    <>
      <PageHeader
        title="Assistente IA"
        description="Converse com o assistente de suporte do DomínioHub."
        action={
          <Button
            variant="secondary"
            leadingIcon={
              <Plus
                size={16}
                aria-hidden="true"
              />
            }
            disabled={sending}
            onClick={
              openNewConversation
            }
          >
            Nova conversa
          </Button>
        }
      />

      <div className="assistant-layout">
        <Card
          padding="none"
          className="assistant-history"
        >
          <div className="assistant-history__header">
            <div>
              <strong>
                Conversas
              </strong>

              <span>
                Suas conversas
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              leadingIcon={
                <RefreshCw
                  size={14}
                  aria-hidden="true"
                />
              }
              disabled={
                listStatus ===
                'loading'
              }
              onClick={() => {
                void retryList();
              }}
            >
              Atualizar
            </Button>
          </div>

          <div className="assistant-history__search">
            <Input
              label="Buscar conversas"
              value={search}
              placeholder="Buscar por título..."
              leadingIcon={
                <Search
                  size={15}
                  aria-hidden="true"
                />
              }
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
              }}
            />
          </div>

          <div className="assistant-history__list">
            {listStatus ===
            'loading' ? (
              <div className="assistant-history__loading">
                {Array.from(
                  {
                    length: 5,
                  },
                  (_, index) => (
                    <div
                      key={index}
                      className="assistant-history__skeleton"
                    >
                      <Skeleton
                        width="80%"
                        height={14}
                      />

                      <Skeleton
                        width="45%"
                        height={11}
                      />
                    </div>
                  ),
                )}
              </div>
            ) : listStatus ===
              'error' ? (
              <div className="assistant-history__error">
                <CircleAlert
                  size={20}
                  aria-hidden="true"
                />

                <p>
                  {listError?.message}
                </p>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void retryList();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredConversations.length ===
              0 ? (
              <div className="assistant-history__empty">
                <MessageSquare
                  size={23}
                  aria-hidden="true"
                />

                <strong>
                  {conversations.length ===
                  0
                    ? 'Nenhuma conversa ainda'
                    : 'Nenhuma conversa encontrada'}
                </strong>

                <span>
                  {conversations.length ===
                  0
                    ? 'Envie uma mensagem para iniciar.'
                    : 'Tente buscar por outro título.'}
                </span>
              </div>
            ) : (
              filteredConversations.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      `assistant-history-item${
                        item.id ===
                        conversationId
                          ? ' assistant-history-item--active'
                          : ''
                      }`
                    }
                    disabled={sending}
                    onClick={() => {
                      selectConversation(
                        item.id,
                      );
                    }}
                  >
                    <MessageSquare
                      size={16}
                      aria-hidden="true"
                    />

                    <span className="assistant-history-item__content">
                      <strong>
                        {getConversationTitle(
                          item,
                        )}
                      </strong>

                      <span>
                        {formatDateTime(
                          item.updatedAt,
                        )}
                      </span>
                    </span>
                  </button>
                ),
              )
            )}
          </div>
        </Card>

        <Card
          padding="none"
          className="assistant-chat"
        >
          {conversationStatus ===
          'loading' ? (
            <div className="assistant-chat__loading">
              <Spinner
                size="lg"
                label="Carregando conversa"
              />

              <span>
                Carregando conversa...
              </span>
            </div>
          ) : conversationStatus ===
            'error' ? (
            <div className="assistant-chat__error">
              <div className="assistant-chat__error-icon">
                <CircleAlert
                  size={24}
                  aria-hidden="true"
                />
              </div>

              <h2>
                Não foi possível abrir a conversa
              </h2>

              <p>
                {
                  conversationError
                    ?.message
                }
              </p>

              {conversationError
                ?.requestId && (
                <span>
                  Código de suporte:{' '}
                  <code>
                    {
                      conversationError
                        .requestId
                    }
                  </code>
                </span>
              )}

              <div className="assistant-chat__error-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigate(
                      '/assistant',
                    );
                  }}
                >
                  Nova conversa
                </Button>

                <Button
                  onClick={() => {
                    void retryConversation();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="assistant-chat__messages"
                role="log"
                aria-label="Mensagens da conversa"
                aria-live="polite"
                aria-relevant="additions text"
                aria-busy={
                  sending
                }
              >
                {showWelcome ? (
                  <div className="assistant-welcome">
                    <div className="assistant-welcome__icon">
                      <Sparkles
                        size={30}
                        aria-hidden="true"
                      />
                    </div>

                    <h2>
                      Como posso ajudar?
                    </h2>

                    <p>
                      Tire dúvidas sobre domínios, eventos, webhooks e o uso da plataforma.
                    </p>

                    <div className="assistant-suggestions">
                      {suggestions.map(
                        (
                          suggestion,
                        ) => (
                          <button
                            key={
                              suggestion
                            }
                            type="button"
                            onClick={() => {
                            applySuggestion(
                                suggestion,
                              );
                            }}
                          >
                            {
                              suggestion
                            }
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {visibleMessages.map(
                      renderMessage,
                    )}

                    {pendingMessage && (
                      <article className="assistant-message assistant-message--user">
                        <div className="assistant-message__avatar">
                          <UserRound
                            size={17}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="assistant-message__content">
                          <div className="assistant-message__meta">
                            <strong>
                              Você
                            </strong>

                            <span>
                              Enviando
                            </span>
                          </div>

                          <p>
                            {
                              pendingMessage
                            }
                          </p>
                        </div>
                      </article>
                    )}

                    {sending && (
                      <article
                        className="assistant-message assistant-message--assistant assistant-message--thinking"
                      >
                        <div className="assistant-message__avatar">
                          <Sparkles
                            size={17}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="assistant-message__content">
                          <div className="assistant-thinking">
                            <Spinner
                              size="sm"
                              label="Assistente pensando"
                            />

                            <span>
                              Assistente está pensando...
                            </span>
                          </div>
                        </div>
                      </article>
                    )}
                  </>
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />
              </div>

              <div className="assistant-composer">
                {sendError && (
                  <div
                    id="assistant-message-error"
                    className="assistant-composer__error"
                    role="alert"
                  >
                    <CircleAlert
                      size={16}
                      aria-hidden="true"
                    />

                    <div>
                      <span>
                        {
                          sendError.message
                        }
                      </span>

                      {sendError.requestId && (
                        <small>
                          Código de suporte:{' '}
                          <code>
                            {
                              sendError.requestId
                            }
                          </code>
                        </small>
                      )}
                    </div>
                  </div>
                )}

                <form
                  className="assistant-composer__form"
                  onSubmit={(event) => {
                    void sendMessage(
                      event,
                    );
                  }}
                >
                  <label
                    className="assistant-composer__field"
                    htmlFor="assistant-message"
                  >
                    <span className="assistant-composer__label">
                      Mensagem
                    </span>

                    <textarea
                      ref={textareaRef}
                      id="assistant-message"
                      value={composer}
                      maxLength={4000}
                      rows={3}
                      aria-invalid={
                        sendError
                          ? true
                          : undefined
                      }
                      aria-describedby={
                        sendError
                          ? 'assistant-message-help assistant-message-count assistant-message-error assistant-message-disclaimer'
                          : 'assistant-message-help assistant-message-count assistant-message-disclaimer'
                      }
                      disabled={
                        sending ||
                        (
                          Boolean(
                            conversationId,
                          ) &&
                          conversationStatus !==
                            'success'
                        )
                      }
                      placeholder="Digite sua mensagem..."
                      onChange={(event) => {
                        setComposer(
                          event.target
                            .value,
                        );

                        setSendError(
                          null,
                        );
                      }}
                      onKeyDown={
                        handleComposerKeyDown
                      }
                    />
                  </label>

                  <div className="assistant-composer__footer">
                    <span
                      id="assistant-message-help"
                      className="assistant-composer__hint"
                    >
                      Enter envia · Shift + Enter quebra a linha
                    </span>

                    <div className="assistant-composer__actions">
                      <span
                        id="assistant-message-count"
                        className={
                          `assistant-composer__count${
                            composer.length >
                            3900
                              ? ' assistant-composer__count--warning'
                              : ''
                          }`
                        }
                      >
                        {
                          composer.length
                        }
                        /4000
                      </span>

                      <Button
                        type="submit"
                        loading={sending}
                        disabled={
                          !canSend
                        }
                        leadingIcon={
                          <Send
                            size={16}
                            aria-hidden="true"
                          />
                        }
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                </form>

                <p
                  id="assistant-message-disclaimer"
                  className="assistant-composer__disclaimer"
                >
                  O Assistente IA pode cometer erros. Confirme informações importantes antes de tomar decisões.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
