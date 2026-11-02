import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Brand } from '../brand/Brand';
import { IconButton } from '../ui/IconButton';
import { useAuth } from '../../features/auth/useAuth';
import { cn } from '../../lib/cn';
import { navigationItems } from './navigation-items';

interface AppSidebarProps {
  compact?: boolean;
  onNavigate?: () => void;
}

const roleLabels = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  SUPPORT: 'Suporte',
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function AppSidebar({
  compact = false,
  onNavigate,
}: AppSidebarProps) {
  const { user, hasPermission, logout } = useAuth();

  const visibleItems = navigationItems.filter(
    (item) =>
      !item.permission ||
      hasPermission(item.permission),
  );

  return (
    <aside
      className={cn(
        'app-sidebar',
        compact && 'app-sidebar--compact',
      )}
      aria-label="Navegação principal"
    >
      <div
        className="app-sidebar__brand"
        title={compact ? 'DomínioHub' : undefined}
      >
        <Brand tone="light" />
      </div>

      <nav
        className="app-sidebar__nav"
        aria-label="Navegação principal"
      >
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'app-sidebar__nav-link',
                  isActive &&
                    'app-sidebar__nav-link--active',
                )
              }
              aria-label={
                compact ? item.label : undefined
              }
              title={compact ? item.label : undefined}
              onClick={onNavigate}
            >
              <Icon size={20} aria-hidden="true" />
              <span
                className={
                  compact
                    ? 'app-sidebar__visually-hidden'
                    : 'app-sidebar__nav-link-label'
                }
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <footer className="app-sidebar__footer">
          <div className="app-sidebar__user">
            <span
              className="app-sidebar__avatar"
              aria-hidden="true"
            >
              {getInitials(user.name)}
            </span>

            {!compact && (
              <div className="app-sidebar__user-details">
                <span className="app-sidebar__user-name">
                  {user.name}
                </span>
                <span className="app-sidebar__user-role">
                  {roleLabels[user.role]}
                </span>
              </div>
            )}
          </div>

          {compact ? (
            <IconButton
              className="app-sidebar__logout"
              variant="ghost"
              aria-label="Sair"
              title="Sair"
              icon={<LogOut size={18} aria-hidden="true" />}
              onClick={logout}
            />
          ) : (
            <button
              className="app-sidebar__logout"
              type="button"
              onClick={logout}
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Sair</span>
            </button>
          )}
        </footer>
      )}
    </aside>
  );
}
