import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Crown,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  Phone,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HOTLINE_DISPLAY, HOTLINE_TEL, ROLE_LABELS } from '../../utils/format';

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
      isActive ? 'text-[#E86B86]' : 'text-[#F5F0E6]/80 hover:text-[#E86B86]'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#0B0B0E]/90 backdrop-blur-xl border-b border-[#4A0E1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8254E] via-[#9E1B32] to-[#4A0E1E] flex items-center justify-center shadow-wine group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-[#F5F0E6]" />
          </div>
          <div>
            <div className="font-serif text-xl font-bold tracking-wider text-[#F5F0E6]">
              KING<span className="text-[#C83254]">BEEF</span>
            </div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[#F5F0E6]/55">
              Steak &amp; Pasta House
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/menu" className={navLinkClass}>
            Thực đơn
          </NavLink>
          <NavLink to="/booking" className={navLinkClass}>
            Đặt bàn 3D
          </NavLink>
          <NavLink to="/lookup" className={navLinkClass}>
            <span className="inline-flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Tra cứu đơn
            </span>
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

        {/* Desktop Hotline + Auth / CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href={HOTLINE_TEL}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#4A0E1E]/45 border border-[#9E1B32]/50 text-xs font-semibold text-[#F5F0E6] hover:border-[#C83254] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#E86B86]" />
            {HOTLINE_DISPLAY}
          </a>

          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#16161C] border border-[#4A0E1E] hover:border-[#C83254]/70 transition-colors"
              >
                <User className="w-4 h-4 text-[#E86B86]" />
                <div className="text-left leading-tight">
                  <div className="text-xs font-semibold text-[#F5F0E6] max-w-[130px] truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-[#E86B86]">{ROLE_LABELS[user.role]}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2.5 rounded-xl bg-[#16161C] border border-[#4A0E1E] text-[#F5F0E6]/70 hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline-wine py-2 px-4">
                Đăng nhập
              </Link>
              <Link to="/booking" className="btn-wine py-2 px-4">
                <CalendarCheck className="w-4 h-4" />
                Đặt bàn ngay
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg text-[#F5F0E6] hover:bg-white/5"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#4A0E1E] bg-[#0B0B0E]/95 px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2.5">
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/menu" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Thực đơn
            </NavLink>
            <NavLink to="/booking" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Đặt bàn 3D (Không cần đăng nhập)
            </NavLink>
            <NavLink to="/lookup" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Tra cứu đơn đặt bàn
            </NavLink>
            {isStaffMember && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                Quản trị ({ROLE_LABELS[user.role]})
              </NavLink>
            )}
            <a
              href={HOTLINE_TEL}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#E86B86] pt-1"
            >
              <Phone className="w-3.5 h-3.5" />
              Hotline: {HOTLINE_DISPLAY}
            </a>
          </div>
          <div className="pt-3 border-t border-[#4A0E1E] flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline-wine w-full"
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
                  className="btn-outline-wine w-full"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/booking"
                  onClick={() => setMobileOpen(false)}
                  className="btn-wine w-full"
                >
                  Đặt bàn 3D ngay
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
