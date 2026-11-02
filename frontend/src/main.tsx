import {
  StrictMode,
} from 'react';

import {
  createRoot,
} from 'react-dom/client';

import {
  BrowserRouter,
} from 'react-router-dom';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import './styles/globals.css';
import './styles/design-system.css';
import './styles/login.css';
import './styles/app-layout.css';
import './styles/dashboard.css';
import './styles/pagination.css';
import './styles/users.css';
import './styles/domains.css';
import './styles/events.css';
import './styles/webhooks.css';
import './styles/assistant.css';

import {
  App,
} from './app/App';

const rootElement =
  document.getElementById(
    'root',
  );

if (!rootElement) {
  throw new Error(
    'Root element was not found.',
  );
}

createRoot(
  rootElement,
).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
