import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Wine,
  ShieldCheck,
  Award,
  Search,
  ExternalLink,
} from 'lucide-react';
import HeroScene3D from '../components/three/HeroScene3D';
import VatNotice from '../components/common/VatNotice';
import MenuImage from '../components/common/MenuImage';
import { api } from '../services/api';
import { HOTLINE_DISPLAY, HOTLINE_TEL, formatVND, getGoogleMapsUrl } from '../utils/format';

export default function HomePage() {
  const [branches, setBranches] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);

  useEffect(() => {
    api
      .get('/branches')
      .then((res) => setBranches(res.branches || []))
      .catch(() => {});

    api
      .get('/menu')
      .then((res) => {
        const items = res.items || [];
        const highlights = items.filter((m) =>
          [
            'Beef Wellington Premium',
            'Steak Kobe',
            'What The Steak Bò Kobe',
            'Sweetie Set',
            'King & Queen',
            'Salad Burrata',
          ].some((prefix) => m.name.startsWith(prefix))
        );
        setFeaturedItems(highlights.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* HERO 3D */}
      <section className="relative min-h-[88vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <HeroScene3D />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B0B0E] via-[#0B0B0E]/75 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-transparent to-[#0B0B0E]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4A0E1E]/75 border border-[#9E1B32]/70 text-[#F5F0E6] text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#E86B86]" />
              KingBeef • Steak &amp; Pasta House
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-[1.2] text-[#F5F0E6]">
              Chúng tôi tin rằng một bữa ăn ngon luôn xứng đáng với{' '}
              <span className="text-[#C83254]">một cuộc gặp gỡ đáng nhớ.</span>
            </h1>

            <div className="space-y-3 text-base sm:text-lg text-[#F5F0E6]/80 leading-relaxed">
              <p>
                Kingbeef mang đến những trải nghiệm ẩm thực được chăm chút từ hương vị, cách trình
                bày đến không gian và dịch vụ, với mức giá để nhiều người có thể tận hưởng.
              </p>
              <p>
                Để mỗi lần gặp gỡ không chỉ là một bữa tối, mà còn là một lý do để quay lại.
              </p>
            </div>

            <div className="border-l-2 border-[#C83254] pl-4 py-0.5">
              <p className="font-serif italic text-xl sm:text-2xl font-bold text-[#E86B86] tracking-wide">
                Kingbeef – Ngon là để gặp lại!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to="/booking" className="btn-wine px-7 py-3.5 text-base">
                Chọn bàn 3D ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/menu" className="btn-outline-wine px-6 py-3.5 text-base">
                Khám phá thực đơn
              </Link>
              <Link
                to="/lookup"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium text-[#E86B86] hover:text-[#F5F0E6] transition-colors"
              >
                <Search className="w-4 h-4" />
                Tra cứu đơn đã đặt
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg border-t border-[#4A0E1E]">
              <div>
                <div className="font-serif text-2xl font-bold text-[#E86B86]">02</div>
                <div className="text-xs text-[#F5F0E6]/60">Chi nhánh trung tâm</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#E86B86]">07</div>
                <div className="text-xs text-[#F5F0E6]/60">Sảnh tiệc đa phong cách</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#E86B86]">52+</div>
                <div className="text-xs text-[#F5F0E6]/60">Tuyệt phẩm ẩm thực Âu</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GIA TRI THUONG HIEU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Award,
              title: 'Nguyên Liệu Thượng Hạng',
              desc: 'Bò Kobe, lõi vai bò Mỹ, cá hồi Na Uy và Beef Wellington chế biến thủ công theo tiêu chuẩn bếp Âu.',
            },
            {
              icon: Wine,
              title: 'Ưu Đãi Couple Set Đẳng Cấp',
              desc: 'Sweetie Set miễn phí trang trí bàn tiệc nến & hoa; nhận ngay ưu đãi 2 ly rượu vang tùy ý chỉ 199.000đ.',
            },
            {
              icon: ShieldCheck,
              title: 'Đặt Bàn 3D Không Cần Đăng Nhập',
              desc: 'Xoay, phóng to sơ đồ 3D từng sảnh, chọn vị trí yêu thích và nhận mã VietQR giữ bàn 2 giờ tức thì.',
            },
          ].map((item, idx) => (
            <div key={idx} className="glass-card-hover p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#4A0E1E]/70 border border-[#9E1B32]/60 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#E86B86]" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-[#F5F0E6]">{item.title}</h3>
              <p className="text-sm text-[#F5F0E6]/68 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HE THONG 2 CHI NHANH & 7 SANH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#E86B86] mb-2">
              Không Gian Kiến Trúc
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              2 Chi Nhánh — 7 Sảnh Tiệc Độc Bản
            </h2>
          </div>
          <a
            href={HOTLINE_TEL}
            className="text-sm text-[#E86B86] hover:underline inline-flex items-center gap-1.5 font-semibold"
          >
            <Phone className="w-4 h-4" />
            Hotline đặt bàn: {HOTLINE_DISPLAY}
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {branches.map((branch) => (
            <div key={branch.id} className="glass-card-hover p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-2xl font-serif font-bold text-[#E86B86]">
                    KingBeef {branch.name}
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4A0E1E]/70 text-[#F5F0E6] border border-[#9E1B32]/60">
                    {branch.halls?.length || 0} Sảnh
                  </span>
                </div>

                <div className="space-y-2 text-sm text-[#F5F0E6]/75 mb-6">
                  <a
                    href={getGoogleMapsUrl(branch.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở chỉ đường trên Google Maps"
                    className="flex items-start gap-2 hover:text-[#E86B86] hover:underline transition-colors group"
                  >
                    <MapPin className="w-4 h-4 text-[#C83254] shrink-0 mt-0.5" />
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span>{branch.address}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#E86B86] opacity-75 group-hover:opacity-100" />
                    </span>
                  </a>
                  <a
                    href={HOTLINE_TEL}
                    className="flex items-center gap-2 hover:text-[#E86B86] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#C83254]" />
                    <span>{branch.phone || HOTLINE_DISPLAY}</span>
                  </a>
                </div>

                <div className="space-y-2.5 mb-6">
                  {(branch.halls || []).map((hall) => (
                    <div
                      key={hall.id}
                      className="p-3.5 rounded-xl bg-[#0B0B0E]/75 border border-[#4A0E1E]/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-sm text-[#F5F0E6] flex items-center gap-2">
                          {hall.name}
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#4A0E1E]/65 text-[#E86B86]">
                            {hall.type === 'outdoor'
                              ? 'Ngoài trời'
                              : hall.type === 'vip'
                              ? 'VIP riêng tư'
                              : 'Trong nhà'}
                          </span>
                        </div>
                        <p className="text-xs text-[#F5F0E6]/55 mt-0.5 line-clamp-1">
                          {hall.description}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#E86B86] shrink-0">
                        {hall._count?.tables || 0} bàn
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={`/booking?branchId=${branch.id}`}
                className="btn-wine w-full justify-center"
              >
                Đặt bàn 3D tại Chi nhánh {branch.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* MON STEAK / AU NOI BAT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#E86B86] mb-2">
              Signature Culinary
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Tuyệt Phẩm Steak &amp; Couple Set Nổi Bật
            </h2>
          </div>
          <VatNotice />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <div key={item.id} className="glass-card-hover overflow-hidden flex flex-col">
              <div className="relative h-52 overflow-hidden bg-[#0B0B0E]">
                <MenuImage
                  src={item.imageUrl}
                  alt={item.name}
                  category={item.category}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16161C] via-transparent to-transparent" />
                {item.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#9E1B32] text-[#F5F0E6] border border-[#C83254] shadow-lg">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#E86B86] mb-1">
                    {item.category}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#F5F0E6] mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#F5F0E6]/65 line-clamp-2 mb-4">{item.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div>
                    <div className="text-lg font-bold text-[#E86B86]">{formatVND(item.price)}</div>
                    <div className="text-[10px] text-[#F5F0E6]/45">Chưa bao gồm VAT</div>
                  </div>
                  {item.requiresAdvanceOrderHours > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#F08CA2]">
                      <Clock className="w-3.5 h-3.5" />
                      Đặt trước {item.requiresAdvanceOrderHours}h
                    </span>
                  ) : (
                    <Link to="/booking" className="text-xs text-[#E86B86] hover:underline">
                      Đặt bàn kèm món →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/menu" className="btn-outline-wine px-8 py-3">
            Xem toàn bộ 52 món trong Thực đơn
          </Link>
        </div>
      </section>
    </div>
  );
}
