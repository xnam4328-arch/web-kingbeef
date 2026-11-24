import { Link } from 'react-router-dom';
import { Crown, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import VatNotice from './VatNotice';
import { HOTLINE_DISPLAY, HOTLINE_TEL, getGoogleMapsUrl } from '../../utils/format';

export default function Footer() {
  return (
    <footer className="border-t border-[#4A0E1E] bg-[#08080B] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B8254E] via-[#9E1B32] to-[#4A0E1E] flex items-center justify-center shadow-wine">
              <Crown className="w-5 h-5 text-[#F5F0E6]" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-wider">
                KING<span className="text-[#C83254]">BEEF</span>
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#F5F0E6]/50">
                Steak &amp; Pasta House
              </div>
            </div>
          </div>
          <p className="text-sm text-[#F5F0E6]/65 leading-relaxed mb-4">
            Nghệ thuật ẩm thực Âu tinh tế với Steak thượng hạng, Pasta thủ công và không gian kiến trúc
            Dark Luxury sắc Đỏ rượu vang quyến rũ bậc nhất Sài Gòn.
          </p>
          <VatNotice />
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-lg text-[#E86B86]">Hệ Thống Chi Nhánh</h4>
          <div className="space-y-3 text-sm text-[#F5F0E6]/75">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C83254] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#F5F0E6]">Chi nhánh Tân Bình</div>
                <a
                  href={getGoogleMapsUrl('120 Trương Công Định, Quận Tân Bình, TP.HCM')}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Xem chỉ đường trên Google Maps"
                  className="inline-flex items-center gap-1 hover:text-[#E86B86] hover:underline transition-colors"
                >
                  <span>120 Trương Công Định, Quận Tân Bình, TP.HCM</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                </a>
                <div className="text-xs text-[#E86B86]/85">Sảnh: Classic • Gallery • Train to Love</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C83254] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#F5F0E6]">Chi nhánh Gò Vấp</div>
                <a
                  href={getGoogleMapsUrl('495 Phan Văn Trị, Quận Gò Vấp, TP.HCM')}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Xem chỉ đường trên Google Maps"
                  className="inline-flex items-center gap-1 hover:text-[#E86B86] hover:underline transition-colors"
                >
                  <span>495 Phan Văn Trị, Quận Gò Vấp, TP.HCM</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                </a>
                <div className="text-xs text-[#E86B86]/85">Sảnh: Sweet • Love • VIP • Mây (Outdoor)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-serif text-lg text-[#E86B86]">Liên Hệ &amp; Giờ Mở Cửa</h4>
          <div className="space-y-2.5 text-sm text-[#F5F0E6]/75">
            <a
              href={HOTLINE_TEL}
              className="flex items-center gap-2.5 hover:text-[#E86B86] transition-colors font-semibold text-[#F5F0E6]"
            >
              <Phone className="w-4 h-4 text-[#C83254]" />
              <span>Hotline toàn hệ thống: {HOTLINE_DISPLAY}</span>
            </a>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#C83254]" />
              <span>Mở cửa hàng ngày: 10:30 – 22:30</span>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link to="/booking" className="btn-wine text-xs py-2 px-4">
              Đặt bàn 3D ngay
            </Link>
            <Link to="/lookup" className="btn-outline-wine text-xs py-2 px-4">
              Tra cứu đặt bàn
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-4 text-center text-xs text-[#F5F0E6]/45">
        © {new Date().getFullYear()} KingBeef Steak &amp; Pasta House • Hotline:{' '}
        <a href={HOTLINE_TEL} className="text-[#E86B86] hover:underline">
          {HOTLINE_DISPLAY}
        </a>
      </div>
    </footer>
  );
}
