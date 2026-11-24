import { useEffect, useState } from 'react';

const CATEGORY_FALLBACKS = {
  Appetizers:
    'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=800&q=80',
  Soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  Salad:
    'https://images.unsplash.com/photo-1608032077018-c9aad9565d29?auto=format&fit=crop&w=800&q=80',
  Pasta:
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80',
  'Steak & Main Course':
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
  'Drink & Dessert':
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
  'Couple Set':
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
};

// Anh du phong rieng cho tung mon nuoc/trang mieng khong co anh chup rieng trong menu TB.pdf
const SLUG_FALLBACKS = {
  'soda-trai-cay':
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  'nuoc-ngot-lon':
    'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=800&q=80',
  'nuoc-suoi':
    'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=800&q=80',
  'mocktail-kingfresh':
    'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80',
  'mocktail-ocean-blue':
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  'kem-trai-cay':
    'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
  'panna-cotta-trai-tim':
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
};

const INLINE_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#16161C"/>
        <stop offset="55%" stop-color="#4A0E1E"/>
        <stop offset="100%" stop-color="#0B0B0E"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#g)"/>
    <text x="50%" y="48%" text-anchor="middle" fill="#F5F0E6" font-family="Georgia,serif" font-size="34" font-weight="bold">KINGBEEF</text>
    <text x="50%" y="60%" text-anchor="middle" fill="#E86B86" font-family="sans-serif" font-size="14" letter-spacing="4">STEAK &amp; PASTA HOUSE</text>
  </svg>`
)}`;

function resolveFallback(src, category) {
  if (src) {
    const match = Object.keys(SLUG_FALLBACKS).find((slug) => src.includes(slug));
    if (match) return SLUG_FALLBACKS[match];
  }
  return CATEGORY_FALLBACKS[category] || INLINE_SVG_FALLBACK;
}

function withBaseUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  const base = import.meta.env.BASE_URL || '/';
  const cleaned = src.startsWith('/') ? src.slice(1) : src;
  return `${base}${cleaned}`;
}

export default function MenuImage({ src, alt, category, className = '' }) {
  const [stage, setStage] = useState(0); // 0: anh that tu menu TB.pdf (/images/menu/*.jpg), 1: Unsplash fallback, 2: inline SVG

  useEffect(() => {
    setStage(0);
  }, [src]);

  const currentSrc =
    stage === 0 && src
      ? withBaseUrl(src)
      : stage <= 1
      ? resolveFallback(src, category)
      : INLINE_SVG_FALLBACK;

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => setStage((s) => Math.min(s + 1, 2))}
      className={className}
    />
  );
}
