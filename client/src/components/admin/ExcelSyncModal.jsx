import { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  X,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  downloadReservationsExcel,
} from '../../utils/excelExport';
import { formatDateTimeVN } from '../../utils/format';

export default function ExcelSyncModal({ reservations = [], onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true';

  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [localExcelPath, setLocalExcelPath] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    api
      .get('/reservations/excel-sync/config')
      .then((res) => {
        const cfg = res.config || {};
        setWebhookUrl(cfg.webhookUrl || '');
        setAutoSync(cfg.autoSync !== false);
        setLocalExcelPath(cfg.localExcelPath || '');
        setLastSyncedAt(cfg.lastSyncedAt || null);
      })
      .catch(() => {});
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.put('/reservations/excel-sync/config', {
        webhookUrl: webhookUrl.trim(),
        autoSync,
      });
      setLastSyncedAt(res.config?.lastSyncedAt || lastSyncedAt);
      setFeedback({ type: 'success', text: res.message });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/reservations/excel-sync/sync-now', {});
      setLastSyncedAt(res.config?.lastSyncedAt || new Date().toISOString());
      setFeedback({ type: 'success', text: res.message });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard?.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#F5F0E6]/60 hover:text-[#F5F0E6]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#F5F0E6]">
              Liên Kết &amp; Đồng Bộ Excel Đặt Bàn
            </h3>
            <p className="text-xs text-[#F5F0E6]/65 mt-0.5">
              Tự động đẩy toàn bộ thông tin đặt bàn, món đặt trước, cọc QR và trạng thái Check-in
              sang file Excel / Google Sheets để nhân viên phục vụ xác nhận khi khách đến.
            </p>
          </div>
        </div>

        {/* 1. Tai file Excel (.xlsx) & File tu dong cap nhat tren may */}
        <div className="p-4 rounded-xl bg-[#0B0B0E]/80 border border-emerald-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-emerald-300">
                1. File Excel 3 Sheet chuẩn KingBeef (.xlsx)
              </div>
              <p className="text-xs text-[#F5F0E6]/65 mt-0.5">
                Gồm 3 sheet: <strong>Tất cả đơn</strong>, <strong>Chi nhánh Tân Bình</strong>,{' '}
                <strong>Chi nhánh Gò Vấp</strong> — có sẵn cột <em>"Xác nhận khách đến"</em> cho
                nhân viên phục vụ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadReservationsExcel(reservations)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Tải Excel ngay ({reservations.length} đơn)
            </button>
          </div>

          {!isStaticMode && localExcelPath && (
            <div className="text-[11px] text-[#F5F0E6]/65 bg-[#16161C] px-3 py-2 rounded-lg border border-white/10">
              <strong className="text-emerald-300">File tự động cập nhật trên máy chủ:</strong>{' '}
              <span className="font-mono break-all">{localExcelPath}</span>
              <div className="mt-0.5 text-[#F5F0E6]/50">
                * Mỗi khi khách đặt bàn mới hoặc nhân viên bấm Check-in / Duyệt cọc, file này tự
                động ghi mới ngay lập tức.
              </div>
            </div>
          )}
        </div>

        {/* 2. Lien ket Excel Online / Google Sheets tu dong (Real-time Webhook) */}
        <form onSubmit={handleSaveConfig} className="p-4 rounded-xl bg-[#0B0B0E]/80 border border-[#4A0E1E] space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[#E86B86] inline-flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              2. Liên kết bảng tính Online tự động (Google Sheets / Excel Online)
            </div>
            {lastSyncedAt && (
              <span className="text-[11px] text-emerald-400">
                Đồng bộ gần nhất: {formatDateTimeVN(lastSyncedAt)}
              </span>
            )}
          </div>

          <p className="text-xs text-[#F5F0E6]/70 leading-relaxed">
            Dán đường dẫn <strong>Google Apps Script Web App URL</strong> (kết nối Google Sheets)
            hoặc <strong>Power Automate Webhook URL</strong> (kết nối Microsoft Excel Online). Mọi
            đơn khách đặt sẽ tự động thêm dòng mới &amp; tự cập nhật cột Check-in theo Mã đặt bàn!
          </p>

          <div>
            <label className="block text-xs font-medium text-[#F5F0E6]/80 mb-1.5">
              Đường dẫn Webhook Excel Online / Google Sheets
            </label>
            <input
              type="url"
              disabled={!isAdmin}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="input-luxury text-xs font-mono"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[#F5F0E6]/85 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 accent-[#9E1B32]"
            />
            <span>Tự động gửi thông tin sang bảng tính mỗi khi khách đặt bàn / nhân viên Check-in</span>
          </label>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {isAdmin && (
              <button type="submit" disabled={saving} className="btn-wine text-xs py-2 px-4">
                {saving ? 'Đang lưu...' : 'Lưu liên kết'}
              </button>
            )}
            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncNow}
              className="btn-outline-wine text-xs py-2 px-4"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Đang đồng bộ...' : 'Đồng bộ tất cả đơn ngay'}
            </button>
            <button
              type="button"
              onClick={() => setShowScript((v) => !v)}
              className="text-xs text-[#E86B86] hover:underline ml-auto"
            >
              {showScript ? 'Ẩn hướng dẫn tạo link' : 'Hướng dẫn tạo link Google Sheets (30 giây)'}
            </button>
          </div>
        </form>

        {/* Huong dan & Ma Apps Script copy 1-click */}
        {showScript && (
          <div className="p-4 rounded-xl bg-[#0B0B0E]/90 border border-[#9E1B32]/50 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <strong className="text-[#E86B86]">Hướng dẫn liên kết nhanh với Google Sheets:</strong>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#9E1B32] text-[#F5F0E6] font-semibold hover:bg-[#B8254E]"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Đã copy mã!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy mã Apps Script
                  </>
                )}
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#F5F0E6]/75">
              <li>Tạo 1 file Google Sheets mới (có thể tải về thành `.xlsx` bất cứ lúc nào).</li>
              <li>
                Chọn menu <strong>Tiện ích mở rộng → Apps Script</strong>, xóa mã cũ và dán đoạn mã
                bên dưới vào rồi bấm <strong>Lưu</strong>.
              </li>
              <li>
                Bấm <strong>Triển khai (Deploy) → Triển khai mới → Ứng dụng web</strong>, chọn{' '}
                <em>Người có quyền truy cập: Bất kỳ ai (Anyone)</em> → Copy URL dán vào ô phía trên.
              </li>
            </ol>
            <pre className="p-3 rounded-lg bg-[#16161C] border border-white/10 text-[11px] font-mono text-[#F5F0E6]/85 overflow-x-auto max-h-52">
              {GOOGLE_APPS_SCRIPT_TEMPLATE}
            </pre>
          </div>
        )}

        {feedback.text && (
          <div
            className={`p-3.5 rounded-xl text-xs border flex items-center gap-2 ${
              feedback.type === 'error'
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
