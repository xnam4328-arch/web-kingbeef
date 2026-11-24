import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, User, Mail, Phone, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/booking');
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B8254E] via-[#9E1B32] to-[#4A0E1E] flex items-center justify-center mx-auto mb-3 shadow-wine">
            <Crown className="w-6 h-6 text-[#F5F0E6]" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#F5F0E6]">Đăng Ký Thành Viên</h1>
          <p className="text-xs text-[#F5F0E6]/60 mt-1">
            Tạo tài khoản để lưu lịch sử đặt bàn và nhận ưu đãi từ KingBeef
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
            <label className="block text-xs font-medium text-[#F5F0E6]/75 mb-1.5">Họ và tên</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#E86B86]/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="input-luxury pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F5F0E6]/75 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#E86B86]/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="input-luxury pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F5F0E6]/75 mb-1.5">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#E86B86]/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0909 123 456"
                className="input-luxury pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F5F0E6]/75 mb-1.5">
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#E86B86]/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-luxury pl-10 text-sm"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-wine w-full py-3 mt-2">
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <p className="text-center text-xs text-[#F5F0E6]/60 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#E86B86] hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
