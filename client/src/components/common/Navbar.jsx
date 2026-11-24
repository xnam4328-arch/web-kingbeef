import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Crown, Menu, X, User, LogOut, LayoutDashboard, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/format';

export default function Navbar() {
  const { user, logout, isStaffMember } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-[#D4AF37]' : 'text-[#F5F0E6]/80 hover:text-[#D4AF37]'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#0B0B0E]/85 backdrop-blur-xl border-b border-[#D4AF37]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D14] flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-[#0B0B0E]" />
          </div>
          <div>
            <div className="font-serif text-xl font-bold tracking-wider text-[#F5F0E6]">
              KING<span className="text-[#D4AF37]">BEEF</span>
            </div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[#F5F0E6]/55">
              Steak &amp; Pasta House
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={navLinkClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/menu" className={navLinkClass}>
            Thực đơn
          </NavLink>
          <NavLink to="/booking" className={navLinkClass}>
            Đặt bàn 3D
          </NavLink>
          {isStaffMember && (
            <NavLink to="/admin" className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                Quản trị
              </span>
            </NavLink>
          )}
        </nav>

        {/* Desktop Auth / CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#16161C] border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
              >
                <User className="w-4 h-4 text-[#D4AF37]" />
                <div className="text-left leading-tight">
                  <div className="text-xs font-semibold text-[#F5F0E6] max-w-[140px] truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-[#D4AF37]">{ROLE_LABELS[user.role]}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2.5 rounded-xl bg-[#16161C] border border-white/10 text-[#F5F0E6]/70 hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline-gold py-2 px-4">
                Đăng nhập
              </Link>
              <Link to="/booking" className="btn-gold py-2 px-4">
                <CalendarCheck className="w-4 h-4" />
                Đặt bàn ngay
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-[#F5F0E6] hover:bg-white/5"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B0B0E]/95 px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2">
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/menu" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Thực đơn
            </NavLink>
            <NavLink to="/booking" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Đặt bàn 3D
            </NavLink>
            {isStaffMember && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                Quản trị ({ROLE_LABELS[user.role]})
              </NavLink>
            )}
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline-gold w-full"
                >
                  <User className="w-4 h-4" />
                  {user.fullName}
                </Link>
                <button onClick={handleLogout} className="text-sm text-red-400 py-2">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline-gold w-full"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-gold w-full"
                >
                  Đăng ký tài khoản
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
