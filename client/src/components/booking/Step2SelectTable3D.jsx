import { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, Users, RefreshCw } from 'lucide-react';
import HallMap3D from '../three/HallMap3D';
import { api } from '../../services/api';
import { addTwoHours, formatDateVN } from '../../utils/format';

export default function Step2SelectTable3D({
  hallId,
  reservationDate,
  startTime,
  guestCount,
  selectedTable,
  setSelectedTable,
  onBack,
  onNext,
}) {
  const [hallData, setHallData] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTables = () => {
    if (!hallId) return;
    setLoading(true);
    setError('');
    api
      .get(`/halls/${hallId}/tables?date=${reservationDate}&startTime=${startTime}`)
      .then((res) => {
        setHallData(res.hall);
        setTables(res.tables || []);
        // Neu ban da chon truoc do khong con trong thi bo chon
        if (selectedTable) {
          const match = (res.tables || []).find((t) => t.id === selectedTable.id);
          if (!match || match.displayStatus !== 'available') {
            setSelectedTable(null);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
  }, [hallId, reservationDate, startTime]);

  const availableCount = tables.filter((t) => t.displayStatus === 'available').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#D4AF37]">
            Sơ Đồ 3D — {hallData?.name || 'Đang tải...'}
          </h3>
          <p className="text-xs text-[#F5F0E6]/70 mt-0.5">
            Ngày {formatDateVN(reservationDate)} • Khung giờ{' '}
            <strong className="text-[#F5F0E6]">
              {startTime} – {addTwoHours(startTime)}
            </strong>{' '}
            (khóa giữ bàn 2 tiếng) • Còn <strong className="text-emerald-400">{availableCount}</strong>/
            {tables.length} bàn trống
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTables}
          className="btn-outline-gold text-xs py-2 px-3.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới trạng thái bàn
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-[460px] rounded-2xl bg-[#0B0B0E]/80 border border-[#D4AF37]/20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <span className="text-sm text-[#F5F0E6]/65">Đang dựng không gian 3D cho sảnh...</span>
        </div>
      ) : (
        <HallMap3D
          hall={hallData}
          tables={tables}
          selectedTableId={selectedTable?.id}
          onSelectTable={(t) => setSelectedTable(t)}
          selectable={true}
        />
      )}

      {/* Thong tin ban dang chon */}
      {selectedTable ? (
        <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/45 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#D4AF37] shrink-0" />
            <div>
              <div className="font-serif text-lg font-bold text-[#F5F0E6]">
                Đã chọn: Bàn số {selectedTable.tableNumber} ({hallData?.name})
              </div>
              <div className="text-xs text-[#F5F0E6]/75 inline-flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                Sức chứa tiêu chuẩn: {selectedTable.capacity} khách • Số khách của bạn: {guestCount}
              </div>
            </div>
          </div>

          {guestCount > selectedTable.capacity && (
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-lg border border-amber-500/35">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Số khách vượt sức chứa tiêu chuẩn ({selectedTable.capacity}). Nhà hàng sẽ hỗ trợ kê thêm
              ghế nếu phù hợp.
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#0B0B0E]/60 border border-white/10 text-xs text-[#F5F0E6]/65 text-center">
          Vui lòng click trực tiếp vào một bàn màu <strong className="text-emerald-400">Xanh lá</strong>{' '}
          trên sơ đồ 3D để chọn vị trí ngồi.
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button type="button" onClick={onBack} className="btn-outline-gold">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <button
          type="button"
          disabled={!selectedTable}
          onClick={onNext}
          className="btn-gold px-7 py-3"
        >
          Tiếp tục: Đặt món trước (Tùy chọn) →
        </button>
      </div>
    </div>
  );
}
