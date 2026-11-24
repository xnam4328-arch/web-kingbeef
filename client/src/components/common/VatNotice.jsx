import { Info } from 'lucide-react';

export default function VatNotice({ className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#E8CC6C] text-xs font-medium ${className}`}
    >
      <Info className="w-3.5 h-3.5 shrink-0" />
      <span>Giá trên chưa bao gồm thuế VAT</span>
    </div>
  );
}
