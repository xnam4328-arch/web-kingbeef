import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Sparkles, Search } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTodayYMD } from '../utils/format';
import Step1BranchHall from '../components/booking/Step1BranchHall';
import Step2SelectTable3D from '../components/booking/Step2SelectTable3D';
import Step3PreOrderMenu from '../components/booking/Step3PreOrderMenu';
import Step4DepositQR from '../components/booking/Step4DepositQR';

const STEPS = [
  { id: 1, title: 'Thông tin & Sảnh' },
  { id: 2, title: 'Chọn bàn 3D' },
  { id: 3, title: 'Đặt món trước' },
  { id: 4, title: 'Đặt cọc VietQR' },
];

export default function BookingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedHallId, setSelectedHallId] = useState(null);

  // Thong tin khach dat ban (ho tro Guest Booking khong can dang nhap)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Tu dong dien san neu khach da dang nhap
  useEffect(() => {
    if (user) {
      setGuestName((prev) => prev || user.fullName || '');
      setGuestPhone((prev) => prev || user.phone || '');
      setGuestEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [reservationDate, setReservationDate] = useState(defaultDate || getTodayYMD());
  const [startTime, setStartTime] = useState('19:00');
  const [guestCount, setGuestCount] = useState(2);

  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState({});
  const [hasWinePromo, setHasWinePromo] = useState(false);
  const [specialRequest, setSpecialRequest] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdReservation, setCreatedReservation] = useState(null);

  useEffect(() => {
    api
      .get('/branches')
      .then((res) => {
        const list = res.branches || [];
        setBranches(list);
        if (list.length > 0) {
          const qsBranchId = Number(searchParams.get('branchId'));
          const initialBranch = list.find((b) => b.id === qsBranchId) || list[0];
          setSelectedBranchId(initialBranch.id);
          setSelectedHallId(initialBranch.halls?.[0]?.id || null);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const handleSubmitBooking = async () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      setSubmitError('Vui lòng nhập Họ tên và Số điện thoại ở Bước 1 trước khi đặt bàn.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId: Number(menuItemId), quantity }));

    try {
      const res = await api.post('/reservations', {
        branchId: Number(selectedBranchId),
        hallId: Number(selectedHallId),
        tableId: Number(selectedTable.id),
        reservationDate,
        startTime,
        guestCount: Number(guestCount),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || null,
        items,
        hasWinePromo,
        specialRequest,
      });
      setCreatedReservation(res.reservation);
      setStep(4);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2.5">
        <div className="text-xs uppercase tracking-[0.25em] text-[#E86B86]">
          KingBeef 3D Reservation
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold">
          Đặt Bàn Trực Quan Trên Sơ Đồ 3D
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-[#F5F0E6] bg-[#4A0E1E]/60 border border-[#9E1B32]/65 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#E86B86]" />
            Đặt bàn nhanh không cần đăng nhập • Chỉ cần nhập Họ tên &amp; Số điện thoại
          </div>
          <Link
            to="/lookup"
            className="inline-flex items-center gap-1.5 text-xs text-[#E86B86] hover:underline font-medium"
          >
            <Search className="w-3.5 h-3.5" />
            Đã đặt bàn? Tra cứu đơn tại đây
          </Link>
        </div>
      </div>

      {/* Stepper 4 buoc */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {STEPS.map((s) => {
          const isCompleted = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div
              key={s.id}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                isCurrent
                  ? 'bg-[#9E1B32]/25 border-[#C83254] shadow-wine'
                  : isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/35'
                  : 'bg-[#16161C]/70 border-[#4A0E1E]/60 opacity-65'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-[#9E1B32] text-[#F5F0E6]'
                    : isCompleted
                    ? 'bg-emerald-500 text-[#0B0B0E]'
                    : 'bg-white/10 text-[#F5F0E6]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <div className="text-xs font-semibold truncate">{s.title}</div>
            </div>
          );
        })}
      </div>

      {/* Noi dung tung buoc */}
      <div className="glass-card p-5 sm:p-8">
        {step === 1 && (
          <Step1BranchHall
            branches={branches}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            selectedHallId={selectedHallId}
            setSelectedHallId={setSelectedHallId}
            reservationDate={reservationDate}
            setReservationDate={setReservationDate}
            startTime={startTime}
            setStartTime={setStartTime}
            guestCount={guestCount}
            setGuestCount={setGuestCount}
            guestName={guestName}
            setGuestName={setGuestName}
            guestPhone={guestPhone}
            setGuestPhone={setGuestPhone}
            guestEmail={guestEmail}
            setGuestEmail={setGuestEmail}
            isLoggedIn={Boolean(user)}
            onNext={() => {
              setSelectedTable(null);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2SelectTable3D
            hallId={selectedHallId}
            reservationDate={reservationDate}
            startTime={startTime}
            guestCount={guestCount}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3PreOrderMenu
            reservationDate={reservationDate}
            startTime={startTime}
            guestName={guestName}
            guestPhone={guestPhone}
            cart={cart}
            setCart={setCart}
            hasWinePromo={hasWinePromo}
            setHasWinePromo={setHasWinePromo}
            specialRequest={specialRequest}
            setSpecialRequest={setSpecialRequest}
            onBack={() => setStep(2)}
            onSubmitBooking={handleSubmitBooking}
            submitting={submitting}
            submitError={submitError}
          />
        )}

        {step === 4 && (
          <Step4DepositQR
            reservation={createdReservation}
            onUpdated={(updated) => setCreatedReservation(updated)}
          />
        )}
      </div>
    </div>
  );
}
