import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth';

import type {
  Permission,
} from '../features/auth/types';

interface PermissionRouteProps {
  permission: Permission;
}

export function PermissionRoute({
  permission,
}: PermissionRouteProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <Navigate
        to="/403"
        replace
      />
    );
  }

  return <Outlet />;
}
