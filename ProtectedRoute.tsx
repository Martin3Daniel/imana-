import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from '../lib/icons';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-wood">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading…
      </div>
    );
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
