import {
  BarChart3,
  CalendarClock,
  Box,
  UtensilsCrossed,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { ROLE_LABELS } from '../../utils/format';

export const ADMIN_TABS = [
  {
    key: 'analytics',
    label: 'Thống kê & Biểu đồ',
    icon: BarChart3,
    roles: ['admin', 'cashier'],
  },
  {
    key: 'reservations',
    label: 'Đặt bàn & Duyệt cọc QR',
    icon: CalendarClock,
    roles: ['admin', 'cashier', 'staff'],
  },
  {
    key: 'tables',
    label: 'Bàn & Sơ đồ 3D',
    icon: Box,
    roles: ['admin'],
  },
  {
    key: 'menu',
    label: 'Thực đơn & Tồn kho',
    icon: UtensilsCrossed,
    roles: ['admin', 'staff'],
  },
  {
    key: 'customers',
    label: 'Khách hàng',
    icon: Users,
    roles: ['admin'],
  },
  {
    key: 'staff',
    label: 'Nhân sự & Phân quyền',
    icon: ShieldCheck,
    roles: ['admin'],
  },
];

export default function AdminSidebar({ user, activeTab, onSelectTab }) {
  const allowedTabs = ADMIN_TABS.filter((t) => t.roles.includes(user?.role));

  return (
    <aside className="glass-card p-4 space-y-4 h-fit lg:sticky lg:top-24">
      <div className="px-2 pb-3 border-b border-white/10">
        <div className="text-[11px] uppercase tracking-widest text-[#D4AF37]">KingBeef Portal</div>
        <div className="font-serif text-lg font-bold text-[#F5F0E6] mt-0.5 truncate">
          {user?.fullName}
        </div>
        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D4AF37]/15 text-[#E8CC6C] border border-[#D4AF37]/35">
          {ROLE_LABELS[user?.role]}
        </span>
      </div>

      <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {allowedTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-left ${
                active
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89225] text-[#0B0B0E] shadow-gold'
                  : 'text-[#F5F0E6]/75 hover:bg-white/5 hover:text-[#F5F0E6]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
