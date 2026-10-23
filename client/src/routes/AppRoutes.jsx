import { Routes, Route, Navigate } from 'react-router-dom';

import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { PendingRoute } from './PendingRoute';

import { PublicLayout } from '../components/layout/PublicLayout';
import { AppLayout } from '../components/layout/AppLayout';

import Landing from '../pages/public/Landing';
import Pricing from '../pages/public/Pricing';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import Pending from '../pages/public/Pending';
import Invoice from '../pages/public/Invoice';
import NotFound from '../pages/public/NotFound';

import Dashboard from '../pages/app/Dashboard';
import ApiKeys from '../pages/app/ApiKeys';
import Billing from '../pages/app/Billing';
import Profile from '../pages/app/Profile';
import Docs from '../pages/app/Docs';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute allowWhenAuthed />}>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      <Route path="/invoice/:number" element={<Invoice />} />

      <Route element={<PendingRoute />}>
        <Route path="/pending" element={<Pending />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/app/api-keys"  element={<AppLayout><ApiKeys /></AppLayout>} />
        <Route path="/app/billing"   element={<AppLayout><Billing /></AppLayout>} />
        <Route path="/app/profile"   element={<AppLayout><Profile /></AppLayout>} />
        <Route path="/app/docs"      element={<AppLayout><Docs /></AppLayout>} />
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}