import {
  useState,
} from 'react';

import {
  CheckCircle2,
  Globe2,
  Plus,
  Search,
  Webhook,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../components/ui';

import {
  Brand,
} from '../components/brand/Brand';

export function DesignSystemPreviewPage() {
  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const { toast } =
    useToast();

  return (
    <main className="design-preview">
      <header className="design-preview__header">
        <Brand />

        <h1>
          Design System
        </h1>

        <p>
          Referência visual interna
          do DomínioHub.
        </p>
      </header>

      <section className="design-preview__section">
        <h2>Botões</h2>

        <div className="design-preview__row">
          <Button
            leadingIcon={
              <Plus size={16} />
            }
          >
            Criar endpoint
          </Button>

          <Button variant="secondary">
            Cancelar
          </Button>

          <Button variant="ghost">
            Ver detalhes
          </Button>

          <Button variant="danger">
            Desativar
          </Button>

          <Button loading>
            Salvando
          </Button>
        </div>
      </section>

      <section className="design-preview__section">
        <h2>Status</h2>

        <div className="design-preview__row">
          <Badge
            tone="success"
            icon={
              <CheckCircle2
                size={13}
              />
            }
          >
            Ativo
          </Badge>

          <Badge tone="warning">
            Expirando
          </Badge>

          <Badge tone="danger">
            Falhou
          </Badge>

          <Badge tone="info">
            Processando
          </Badge>

          <Badge tone="neutral">
            Desconhecido
          </Badge>

          <Badge tone="indigo">
            Administrador
          </Badge>
        </div>
      </section>

      <section className="design-preview__section">
        <h2>Campos</h2>

        <div className="design-preview__grid">
          <div className="design-preview__form">
            <Input
              label="Buscar domínio"
              placeholder="Buscar..."
              leadingIcon={
                <Search
                  size={16}
                />
              }
            />

            <Input
              label="E-mail"
              type="email"
              value="email-invalido"
              readOnly
              error="Informe um e-mail válido."
            />
          </div>

          <div className="design-preview__form">
            <Select
              label="Status"
              defaultValue="all"
            >
              <option value="all">
                Todos
              </option>

              <option value="active">
                Ativos
              </option>

              <option value="failed">
                Falhou
              </option>
            </Select>

            <Input
              label="External ID"
              placeholder="evt_..."
              hint="Identificador recebido pela integração."
            />
          </div>
        </div>
      </section>

      <section className="design-preview__section">
        <h2>Cards</h2>

        <div className="design-preview__grid">
          <Card
            title="Domínios"
            description="Domínios sincronizados."
          >
            <strong
              style={{
                fontSize: 30,
              }}
            >
              12
            </strong>
          </Card>

          <Card
            title="Falhas de entrega"
            description="Webhooks que exigem atenção."
          >
            <strong
              style={{
                fontSize: 30,
              }}
            >
              3
            </strong>
          </Card>
        </div>
      </section>

      <section className="design-preview__section">
        <h2>Tabela</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Domínio
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead>
                Provider
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell>
                agencia-demo.com.br
              </TableCell>

              <TableCell>
                <Badge tone="success">
                  Ativo
                </Badge>
              </TableCell>

              <TableCell>
                mock-namecheap
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                cliente-demo.com.br
              </TableCell>

              <TableCell>
                <Badge tone="warning">
                  Expirando
                </Badge>
              </TableCell>

              <TableCell>
                mock-namecheap
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="design-preview__section">
        <h2>Carregamento</h2>

        <Card>
          <div className="design-preview__skeletons">
            <Skeleton
              width="34%"
              height={18}
            />

            <Skeleton
              width="78%"
            />

            <Skeleton
              width="63%"
            />

            <Skeleton
              height={52}
              radius={8}
            />
          </div>
        </Card>
      </section>

      <section className="design-preview__section">
        <h2>Estado vazio</h2>

        <Card padding="none">
          <EmptyState
            icon={
              <Webhook
                size={28}
              />
            }
            title="Nenhum endpoint configurado"
            description="Configure um endpoint para receber os eventos processados pelo DomínioHub."
            action={
              <Button
                leadingIcon={
                  <Plus
                    size={16}
                  />
                }
              >
                Novo endpoint
              </Button>
            }
          />
        </Card>
      </section>

      <section className="design-preview__section">
        <h2>Overlays</h2>

        <div className="design-preview__row">
          <Button
            variant="secondary"
            onClick={() => {
              setModalOpen(true);
            }}
          >
            Abrir modal
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              setDrawerOpen(true);
            }}
          >
            Abrir drawer
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              toast({
                tone: 'success',
                title:
                  'Endpoint atualizado',
                description:
                  'As alterações foram salvas.',
              });
            }}
          >
            Mostrar toast
          </Button>
        </div>
      </section>

      <section className="design-preview__section">
        <h2>Identidade</h2>

        <Card>
          <div className="design-preview__row">
            <Globe2
              size={24}
              color="#4F46E5"
            />

            <span>
              Technical Calm —
              DomínioHub
            </span>
          </div>
        </Card>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        title="Novo endpoint"
        description="Configure o destino do webhook."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              Cancelar
            </Button>

            <Button>
              Criar endpoint
            </Button>
          </>
        }
      >
        <Input
          label="URL do destino"
          placeholder="https://api.exemplo.com/webhook"
        />
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        title="Editar endpoint"
        description="Altere as configurações do destino."
        footer={
          <Button>
            Salvar alterações
          </Button>
        }
      >
        <div className="design-preview__form">
          <Input
            label="URL"
            defaultValue="https://api.exemplo.com/webhook"
          />

          <Select
            label="Status"
            defaultValue="active"
          >
            <option value="active">
              Ativo
            </option>

            <option value="inactive">
              Inativo
            </option>
          </Select>
        </div>
      </Drawer>
    </main>
  );
}
