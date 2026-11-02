import { useParams } from 'react-router-dom';

import {
  PlaceholderPage,
} from './PlaceholderPage';

interface ResourcePlaceholderPageProps {
  title: string;
  description: string;
  paramName: string;
}

export function ResourcePlaceholderPage({
  title,
  description,
  paramName,
}: ResourcePlaceholderPageProps) {
  const params = useParams();

  const resourceId =
    params[paramName] ?? 'não informado';

  return (
    <PlaceholderPage
      title={title}
      description={
        `${description} ID atual: ${resourceId}.`
      }
    />
  );
}
