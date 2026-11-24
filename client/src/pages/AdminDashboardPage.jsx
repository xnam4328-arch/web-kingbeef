import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminSidebar, { ADMIN_TABS } from '../components/admin/AdminSidebar';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import ReservationsPanel from '../components/admin/ReservationsPanel';
import Tables3DPanel from '../components/admin/Tables3DPanel';
import MenuInventoryPanel from '../components/admin/MenuInventoryPanel';
import CustomersPanel from '../components/admin/CustomersPanel';
import StaffPanel from '../components/admin/StaffPanel';
import ActivityLogsPanel from '../components/admin/ActivityLogsPanel';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);

  const allowedKeys = useMemo(
    () => ADMIN_TABS.filter((t) => t.roles.includes(user?.role)).map((t) => t.key),
    [user?.role]
  );

  const defaultTab =
    user?.role === 'admin'
      ? 'analytics'
      : allowedKeys.includes('reservations')
      ? 'reservations'
      : allowedKeys[0];

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (!allowedKeys.includes(activeTab) && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [allowedKeys, activeTab, defaultTab]);

  useEffect(() => {
    api
      .get('/branches')
      .then((res) => setBranches(res.branches || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3">
          <AdminSidebar user={user} activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>

        <div className="lg:col-span-9 min-w-0">
          {activeTab === 'analytics' && allowedKeys.includes('analytics') && (
            <AnalyticsPanel branches={branches} />
          )}
          {activeTab === 'reservations' && allowedKeys.includes('reservations') && (
            <ReservationsPanel branches={branches} />
          )}
          {activeTab === 'tables' && allowedKeys.includes('tables') && (
            <Tables3DPanel branches={branches} />
          )}
          {activeTab === 'menu' && allowedKeys.includes('menu') && <MenuInventoryPanel />}
          {activeTab === 'customers' && allowedKeys.includes('customers') && <CustomersPanel />}
          {activeTab === 'staff' && allowedKeys.includes('staff') && (
            <StaffPanel branches={branches} />
          )}
          {activeTab === 'activity-logs' && allowedKeys.includes('activity-logs') && (
            <ActivityLogsPanel branches={branches} />
          )}
        </div>
      </div>
    </div>
  );
}
