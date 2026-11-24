import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 glass-card text-center">
        <h2 className="text-2xl font-serif text-[#D4AF37] mb-3">Không có quyền truy cập</h2>
        <p className="text-[#F5F0E6]/75 text-sm">
          Tài khoản hiện tại của bạn không được cấp quyền truy cập khu vực này.
        </p>
      </div>
    );
  }

  return children;
}
