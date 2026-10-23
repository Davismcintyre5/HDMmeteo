import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeProvider';
import { BrandingProvider } from './context/BrandingProvider';
import { SiteProvider } from './context/SiteProvider';
import { AuthProvider } from './context/AuthProvider';
import { SocketProvider } from './context/SocketProvider';
import { ToastProvider } from './hooks/useToast';

import { AppRoutes } from './routes/AppRoutes';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrandingProvider>
          <SiteProvider>
            <AuthProvider>
              <SocketProvider>
                <BrowserRouter future={routerFuture}>
                  <AppRoutes />
                </BrowserRouter>
              </SocketProvider>
            </AuthProvider>
          </SiteProvider>
        </BrandingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}