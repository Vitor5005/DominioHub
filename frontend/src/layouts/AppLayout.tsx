import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Brand } from '../components/brand/Brand';
import { AppSidebar } from '../components/navigation/AppSidebar';
import { MobileNavigation } from '../components/navigation/MobileNavigation';
import { IconButton } from '../components/ui';

export function AppLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="app-shell">
      <a
        className="app-skip-link"
        href="#main-content"
      >
        Pular para o conteúdo principal
      </a>
      <aside className="app-shell__sidebar app-shell__sidebar--full">
        <AppSidebar />
      </aside>
      <aside className="app-shell__sidebar app-shell__sidebar--compact">
        <AppSidebar compact />
      </aside>

      <MobileNavigation
        open={mobileNavigationOpen}
        onClose={() => {
          setMobileNavigationOpen(false);
        }}
      />

      <div className="app-shell__workspace">
        <header className="app-mobile-header">
          <IconButton
            icon={
              <Menu
                size={20}
                aria-hidden="true"
              />
            }
            variant="ghost"
            aria-label="Abrir navegação"
            aria-expanded={mobileNavigationOpen}
            aria-controls="mobile-navigation-panel"
            onClick={() => {
              setMobileNavigationOpen(true);
            }}
          />
          <Brand />
        </header>

        <main
          id="main-content"
          className="app-main"
          tabIndex={-1}
        >
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
