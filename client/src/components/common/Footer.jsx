import { Link } from 'react-router-dom';
import { Crown, MapPin, Phone, Clock } from 'lucide-react';
import VatNotice from './VatNotice';

export default function Footer() {
  return (
    <footer className="border-t border-[#D4AF37]/15 bg-[#08080B] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D14] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#0B0B0E]" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-wider">
                KING<span className="text-[#D4AF37]">BEEF</span>
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#F5F0E6]/50">
                Steak &amp; Pasta House
              </div>
            </div>
          </div>
          <p className="text-sm text-[#F5F0E6]/65 leading-relaxed mb-4">
            Nghệ thuật ẩm thực Âu tinh tế với Steak thượng hạng, Pasta thủ công và không gian kiến trúc
            Dark Luxury lãng mạn bậc nhất Sài Gòn.
          </p>
          <VatNotice />
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-lg text-[#D4AF37]">Hệ Thống Chi Nhánh</h4>
          <div className="space-y-3 text-sm text-[#F5F0E6]/75">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#F5F0E6]">Chi nhánh Tân Bình</div>
                <div>248 Cộng Hòa, P.12, Q. Tân Bình, TP. HCM</div>
                <div className="text-xs text-[#D4AF37]/80">Sảnh: Classic • Gallery • Train to Love</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#F5F0E6]">Chi nhánh Gò Vấp</div>
                <div>168 Phan Văn Trị, P.5, Q. Gò Vấp, TP. HCM</div>
                <div className="text-xs text-[#D4AF37]/80">Sảnh: Sweet • Love • VIP • Mây (Outdoor)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-lg text-[#D4AF37]">Liên Hệ &amp; Giờ Mở Cửa</h4>
          <div className="space-y-2.5 text-sm text-[#F5F0E6]/75">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>Hotline: 028 3811 6688 — 028 3989 6688</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>Mở cửa hàng ngày: 10:30 – 22:30</span>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/booking" className="btn-gold text-xs py-2 px-4">
              Đặt bàn 3D ngay
            </Link>
            <Link to="/menu" className="btn-outline-gold text-xs py-2 px-4">
              Xem thực đơn
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-4 text-center text-xs text-[#F5F0E6]/45">
        © {new Date().getFullYear()} KingBeef Steak &amp; Pasta House. All rights reserved.
      </div>
    </footer>
  );
}
