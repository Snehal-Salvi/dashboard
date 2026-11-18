import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { NoAccessPage, NotFoundPage } from './pages/StatusPages';
import { SopListPage } from './pages/SopListPage';
import { LoadingState } from './components/common';

/** Signed in? → otherwise SSO login (remembering where the user wanted to go). */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

/** Has a GRAP persona? → otherwise "Access not assigned". */
function RequirePersona() {
  const { user } = useAuth();
  return user?.persona ? <Outlet /> : <NoAccessPage />;
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      {
        element: <RequirePersona />,
        hydrateFallbackElement: <LoadingState />,
        children: [
          { index: true, element: <SopListPage /> },
          // Secondary screens are code-split and loaded on first visit.
          { path: 'sops/new', lazy: async () => ({ Component: (await import('./pages/SopFormPage')).SopFormPage }) },
          { path: 'sops/:id', lazy: async () => ({ Component: (await import('./pages/SopViewPage')).SopViewPage }) },
          { path: 'sops/:id/edit', lazy: async () => ({ Component: (await import('./pages/SopFormPage')).SopFormPage }) },
          { path: 'sops/:id/review', lazy: async () => ({ Component: (await import('./pages/SopReviewPage')).SopReviewPage }) },
          { path: 'sops/:id/activity', lazy: async () => ({ Component: (await import('./pages/SopActivityPage')).SopActivityPage }) },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
