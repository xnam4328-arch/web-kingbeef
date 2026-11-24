import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Khách hàng', email: 'customer@kingbeef.vn', pass: 'Customer@123' },
  { label: 'Admin', email: 'admin@kingbeef.vn', pass: 'Admin@123' },
  { label: 'Thu ngân', email: 'cashier@kingbeef.vn', pass: 'Cashier@123' },
  { label: 'Phục vụ', email: 'staff@kingbeef.vn', pass: 'Staff@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (['admin', 'cashier', 'staff'].includes(user.role) && redirectTo === '/') {
        navigate('/admin');
      } else {
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-8">
        <div className="text-center mb-7">
          <img
            src={`${import.meta.env.BASE_URL}images/kingbeef-logo.png`}
            alt="KingBeef — Steak & Pasta House"
            className="h-20 w-auto object-contain mx-auto mb-3"
          />
          <h1 className="text-3xl font-serif font-bold text-[#F5F0E6]">Đăng Nhập</h1>
          <p className="text-xs text-[#F5F0E6]/60 mt-1">
            Chào mừng trở lại KingBeef Steak &amp; Pasta House
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#F5F0E6]/75 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#E86B86]/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-luxury pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F5F0E6]/75 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#E86B86]/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-luxury pl-10 text-sm"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-wine w-full py-3 mt-2">
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="text-[11px] text-[#F5F0E6]/50 text-center mb-2.5">
            Điền nhanh tài khoản trải nghiệm (từ seed.js):
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.pass);
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-[#0B0B0E]/80 border border-[#4A0E1E] hover:border-[#C83254] text-[#F5F0E6]/85 transition-colors"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#F5F0E6]/60 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-[#E86B86] hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
