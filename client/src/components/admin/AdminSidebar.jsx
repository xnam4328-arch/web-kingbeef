import {
  BarChart3,
  CalendarClock,
  Box,
  UtensilsCrossed,
  Users,
  ShieldCheck,
  History,
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
  {
    key: 'activity-logs',
    label: 'Lịch sử thao tác',
    icon: History,
    roles: ['admin'],
  },
];

export default function AdminSidebar({ user, activeTab, onSelectTab }) {
  const allowedTabs = ADMIN_TABS.filter((t) => t.roles.includes(user?.role));

  return (
    <aside className="glass-card p-4 space-y-4 h-fit lg:sticky lg:top-24">
      <div className="px-2 pb-3 border-b border-white/10">
        <div className="text-[11px] uppercase tracking-widest text-[#E86B86]">KingBeef Portal</div>
        <div className="font-serif text-lg font-bold text-[#F5F0E6] mt-0.5 truncate">
          {user?.fullName}
        </div>
        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#4A0E1E]/80 text-[#F5F0E6] border border-[#9E1B32]/65">
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
                  ? 'bg-gradient-to-r from-[#8B1E3F] via-[#9E1B32] to-[#B8254E] text-[#F5F0E6] shadow-wine'
                  : 'text-[#F5F0E6]/75 hover:bg-[#4A0E1E]/40 hover:text-[#F5F0E6]'
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
