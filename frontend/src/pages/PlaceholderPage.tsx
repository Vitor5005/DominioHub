import {
  PageHeader,
} from '../components/layout/PageHeader';

import {
  Card,
} from '../components/ui';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
      />

      <Card
        title={
          <>
            <span className="placeholder-eyebrow">
              Em construção
            </span>

            <br />

            Estrutura pronta
          </>
        }
        description="O conteúdo funcional e o design definitivo desta página serão implementados nas próximas fases."
      />
    </>
  );
}
