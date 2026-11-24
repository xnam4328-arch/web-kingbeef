import { useEffect, useState } from 'react';
import { UserPlus, Trash2, ShieldCheck, X } from 'lucide-react';
import { api } from '../../services/api';
import { ROLE_LABELS } from '../../utils/format';

export default function StaffPanel({ branches = [] }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    branchId: '',
  });

  const loadStaff = () => {
    setLoading(true);
    api
      .get('/users/staff')
      .then((res) => setStaff(res.staff || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/users/staff', {
        ...form,
        branchId: form.branchId ? Number(form.branchId) : null,
      });
      setFeedback({ type: 'success', text: res.message });
      setModalOpen(false);
      setForm({ fullName: '', email: '', phone: '', password: '', role: 'staff', branchId: '' });
      loadStaff();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      const res = await api.put(`/users/staff/${member.id}`, { role: newRole });
      setFeedback({ type: 'success', text: res.message });
      loadStaff();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Xóa tài khoản nhân sự "${member.fullName}"?`)) return;
    try {
      const res = await api.delete(`/users/staff/${member.id}`);
      setFeedback({ type: 'success', text: res.message });
      loadStaff();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#E86B86]">
            Quản Lý Nhân Sự &amp; Phân Quyền (RBAC)
          </h2>
          <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
            Tạo và phân quyền tài khoản Quản trị viên (Admin), Thu ngân (Cashier) và Phục vụ
            (Staff).
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-wine text-xs py-2 px-4">
          <UserPlus className="w-4 h-4" />
          Thêm nhân sự
        </button>
      </div>

      {feedback.text && (
        <div
          className={`p-3.5 rounded-xl text-xs border ${
            feedback.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0B0E]/80 border-b border-[#4A0E1E] text-[#E86B86] uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Họ tên</th>
                <th className="py-3.5 px-4">Email &amp; SĐT</th>
                <th className="py-3.5 px-4">Chi nhánh</th>
                <th className="py-3.5 px-4">Vai trò (RBAC)</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#F5F0E6]/60">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : (
                staff.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-semibold text-[#F5F0E6] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#E86B86]" />
                      {m.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-[#F5F0E6]/75">
                      <div>{m.email}</div>
                      <div className="text-[11px] text-[#F5F0E6]/50">{m.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#F5F0E6]/80">
                      {m.branch ? `Chi nhánh ${m.branch.name}` : 'Toàn hệ thống'}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0B0B0E] border border-[#9E1B32]/60 text-xs text-[#F5F0E6]"
                      >
                        <option value="admin">{ROLE_LABELS.admin}</option>
                        <option value="cashier">{ROLE_LABELS.cashier}</option>
                        <option value="staff">{ROLE_LABELS.staff}</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/15"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#F5F0E6]/60 hover:text-[#F5F0E6]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-xl font-bold text-[#E86B86] mb-4">
              Tạo Tài Khoản Nhân Sự
            </h3>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Họ tên</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Số điện thoại</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Mật khẩu (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-luxury"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[#F5F0E6]/75">Vai trò</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-luxury"
                  >
                    <option value="staff" className="bg-[#16161C]">
                      Phục vụ (Staff)
                    </option>
                    <option value="cashier" className="bg-[#16161C]">
                      Thu ngân (Cashier)
                    </option>
                    <option value="admin" className="bg-[#16161C]">
                      Quản trị viên (Admin)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[#F5F0E6]/75">Chi nhánh phụ trách</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="input-luxury"
                  >
                    <option value="" className="bg-[#16161C]">
                      Toàn hệ thống
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#16161C]">
                        Chi nhánh {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline-wine text-xs py-2"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-wine text-xs py-2 px-5">
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
