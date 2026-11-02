import {
  ToastProvider,
} from '../components/ui';

import {
  AuthProvider,
} from '../features/auth/AuthProvider';

import {
  AppRoutes,
} from '../routes/AppRoutes';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
