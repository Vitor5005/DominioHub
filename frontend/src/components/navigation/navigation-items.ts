import {
  Activity,
  Globe2,
  LayoutDashboard,
  Sparkles,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';

import type {
  Permission,
} from '../../features/auth/types';

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: Permission;
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Visão geral',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Domínios',
    path: '/domains',
    icon: Globe2,
    permission: 'domains:read',
  },
  {
    label: 'Eventos',
    path: '/events',
    icon: Activity,
    permission: 'events:read',
  },
  {
    label: 'Webhooks',
    path: '/webhooks',
    icon: Webhook,
    permission: 'webhooks:read',
  },
  {
    label: 'Assistente IA',
    path: '/assistant',
    icon: Sparkles,
    permission: 'chat:use',
  },
  {
    label: 'Usuários',
    path: '/users',
    icon: Users,
    permission: 'users:read',
  },
];
