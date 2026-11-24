import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame } from 'lucide-react';

/**
 * HeroShowcase: Hinh anh mon Beef Wellington Premium thuc te cua KingBeef
 * ket hop hieu ung nghieng 3D theo chuot + he thong khoi/hoi nong dong (Volumetric Smoke Canvas)
 * toa ra muot ma xung quanh mon an.
 */
export default function HeroScene3D() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  // Hieu ung khoi nong / hoi thom toa ra lien tuc bang Canvas 2D muot 60fps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || 540;
      height = rect.height || 520;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Sinh cac dam khoi mem mai xung quanh & phia tren mon Beef Wellington
    const SMOKE_COUNT = 38;
    const EMBER_COUNT = 22;

    const spawnSmoke = (randomAge = false) => {
      // Toa khoi quanh khu vuc banh Wellington & vien quanh dia (20% -> 82% chieu rong, 45% -> 78% chieu cao)
      const angle = Math.random() * Math.PI * 2;
      const spreadX = (Math.random() - 0.5) * width * 0.62;
      const spreadY = (Math.random() - 0.5) * height * 0.24;
      const maxLife = 210 + Math.random() * 170;
      return {
        x: width * 0.5 + spreadX,
        y: height * 0.62 + spreadY,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(0.38 + Math.random() * 0.55),
        radius: 26 + Math.random() * 34,
        grow: 0.24 + Math.random() * 0.25,
        life: randomAge ? Math.random() * maxLife : 0,
        maxLife,
        wobbleFreq: 0.012 + Math.random() * 0.014,
        wobbleAmp: 0.3 + Math.random() * 0.5,
        phase: angle,
        maxAlpha: 0.14 + Math.random() * 0.14,
        tint: Math.random() > 0.72 ? 'warm' : 'steam',
      };
    };

    const spawnEmber = (randomAge = false) => {
      const maxLife = 120 + Math.random() * 120;
      return {
        x: width * (0.18 + Math.random() * 0.64),
        y: height * (0.55 + Math.random() * 0.35),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.45 + Math.random() * 0.75),
        size: 1.2 + Math.random() * 2.2,
        life: randomAge ? Math.random() * maxLife : 0,
        maxLife,
        phase: Math.random() * Math.PI * 2,
      };
    };

    const smokes = Array.from({ length: SMOKE_COUNT }, () => spawnSmoke(true));
    const embers = Array.from({ length: EMBER_COUNT }, () => spawnEmber(true));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Ve cac luong khoi / hoi nong lo lung
      for (let i = 0; i < smokes.length; i++) {
        const p = smokes[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          smokes[i] = spawnSmoke(false);
          continue;
        }

        const progress = p.life / p.maxLife;
        // Fade-in nhanh o dau, fade-out muot o cuoi
        const alpha =
          progress < 0.22
            ? (progress / 0.22) * p.maxAlpha
            : (1 - (progress - 0.22) / 0.78) * p.maxAlpha;

        p.x += p.vx + Math.sin(p.life * p.wobbleFreq + p.phase) * p.wobbleAmp;
        p.y += p.vy;
        const r = p.radius + p.life * p.grow;

        const grad = ctx.createRadialGradient(p.x, p.y, r * 0.08, p.x, p.y, r);
        if (p.tint === 'warm') {
          grad.addColorStop(0, `rgba(255, 224, 230, ${alpha * 0.95})`);
          grad.addColorStop(0.45, `rgba(232, 140, 160, ${alpha * 0.45})`);
          grad.addColorStop(1, 'rgba(158, 27, 50, 0)');
        } else {
          grad.addColorStop(0, `rgba(255, 250, 244, ${alpha})`);
          grad.addColorStop(0.5, `rgba(245, 235, 225, ${alpha * 0.48})`);
          grad.addColorStop(1, 'rgba(245, 235, 225, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Ve cac hat tan hong / tia am bay nhe xung quanh
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life += 1;
        if (e.life >= e.maxLife) {
          embers[i] = spawnEmber(false);
          continue;
        }
        const prog = e.life / e.maxLife;
        const a = Math.sin(prog * Math.PI) * 0.75;
        e.x += e.vx + Math.sin(e.life * 0.04 + e.phase) * 0.25;
        e.y += e.vy;

        ctx.fillStyle = `rgba(232, 107, 134, ${a})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleMouseMove = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-ny * 10).toFixed(2)),
      ry: Number((nx * 12).toFixed(2)),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const wellingtonSrc = `${import.meta.env.BASE_URL}images/menu/beef-wellington-premium.jpg`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-xl mx-auto py-6 px-2 sm:px-4 select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Hao quang Do ruou vang phat sang xung quanh mon an */}
      <div className="pointer-events-none absolute inset-4 rounded-full bg-gradient-to-tr from-[#9E1B32]/40 via-[#C83254]/20 to-transparent blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -inset-2 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_55%,rgba(158,27,50,0.34),transparent_68%)] blur-2xl" />

      {/* Khung anh 3D nghieng muot theo chuot */}
      <div
        className="relative rounded-[2rem] p-2.5 bg-gradient-to-br from-[#C83254]/50 via-[#4A0E1E]/80 to-[#16161C]/90 shadow-[0_25px_70px_rgba(158,27,50,0.35)] transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="relative rounded-[1.55rem] overflow-hidden bg-[#0B0B0E] border border-[#C83254]/40 aspect-[4/3]">
          {/* Anh mon Beef Wellington Premium that cua KingBeef */}
          <img
            src={wellingtonSrc}
            alt="Beef Wellington Premium — KingBeef"
            className="w-full h-full object-cover scale-[1.03] transition-transform duration-700 hover:scale-[1.07]"
          />

          {/* Lop phu toi nhe o vien de khoi & badge noi bat hon */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0E]/85 via-transparent to-[#0B0B0E]/20" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.55rem]" />

          {/* Badge Signature goc tren */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0B0E]/80 backdrop-blur-md border border-[#C83254]/60 text-[11px] font-semibold text-[#F5F0E6]">
            <Flame className="w-3.5 h-3.5 text-[#E86B86]" />
            Signature • Nướng tươi nóng hổi
          </div>

          {/* Thong tin mon goc duoi */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="font-serif text-lg sm:text-xl font-bold text-[#F5F0E6] drop-shadow">
                Beef Wellington Premium
              </div>
              <div className="text-[11px] text-[#E86B86] inline-flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                449.000đ (chưa VAT) • Đặt trước tối thiểu 4 giờ
              </div>
            </div>
            <Link
              to="/booking"
              className="px-3.5 py-1.5 rounded-xl bg-[#9E1B32]/90 hover:bg-[#C83254] text-[#F5F0E6] text-xs font-semibold border border-[#E86B86]/40 transition-colors backdrop-blur"
            >
              Đặt trước ngay →
            </Link>
          </div>
        </div>
      </div>

      {/* Lop Canvas khoi / hoi nong toa ra XUNG QUANH va BAY LEN tren Beef Wellington */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-20"
      />
    </div>
  );
}
