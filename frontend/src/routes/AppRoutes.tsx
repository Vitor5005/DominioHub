import {
  Route,
  Routes,
} from 'react-router-dom';

import {
  LoginPage,
} from '../pages/LoginPage';

import {
  DashboardPage,
} from '../pages/DashboardPage';

import {
  DomainsPage,
} from '../pages/DomainsPage';

import {
  DomainDetailPage,
} from '../pages/DomainDetailPage';

import {
  EventsPage,
} from '../pages/EventsPage';

import {
  EventDetailPage,
} from '../pages/EventDetailPage';

import {
  WebhooksPage,
} from '../pages/WebhooksPage';

import {
  AssistantPage,
} from '../pages/AssistantPage';



import {
  StatusPage,
} from '../pages/StatusPage';

import {
  UsersPage,
} from '../pages/UsersPage';

import {
  PermissionRoute,
} from './PermissionRoute';

import {
  ProtectedRoute,
} from './ProtectedRoute';

import {
  DesignSystemPreviewPage,
} from '../pages/DesignSystemPreviewPage';

import {
  AppLayout,
} from '../layouts/AppLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
      {import.meta.env.DEV ? (
        <Route
          path="/__ui"
          element={
            <DesignSystemPreviewPage />
          }
        />
      ) : null}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            index
            element={<DashboardPage />}
          />

          <Route
            element={
              <PermissionRoute
                permission="domains:read"
              />
            }
          >
            <Route
              path="/domains"
              element={<DomainsPage />}
            />

            <Route
              path="/domains/:domainId"
              element={<DomainDetailPage />}
            />
          </Route>

<Route
  element={
    <PermissionRoute
      permission="events:read"
    />
  }
>
  <Route
    path="/events"
    element={<EventsPage />}
  />

  <Route
    path="/events/:eventId"
    element={<EventDetailPage />}
  />
</Route>

<Route
  element={
    <PermissionRoute
      permission="webhooks:read"
    />
  }
>
  <Route
    path="/webhooks"
    element={<WebhooksPage />}
  />
</Route>

<Route
  element={
    <PermissionRoute
      permission="chat:use"
    />
  }
>
  <Route
    path="/assistant"
    element={<AssistantPage />}
  />

  <Route
    path="/assistant/:conversationId"
    element={<AssistantPage />}
  />
</Route>

          <Route
            element={
              <PermissionRoute
                permission="users:read"
              />
            }
          >
            <Route
              path="/users"
              element={<UsersPage />}
            />
          </Route>

          <Route
            path="/403"
            element={
              <StatusPage
                code="403"
                title="Acesso negado"
                description="Você não possui permissão para acessar esta área."
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <StatusPage
            code="404"
            title="Página não encontrada"
            description="A página que você tentou acessar não existe."
          />
        }
      />
    </Routes>
  );
}
