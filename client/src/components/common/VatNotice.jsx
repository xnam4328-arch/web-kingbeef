import { Info } from 'lucide-react';

export default function VatNotice({ className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4A0E1E]/60 border border-[#9E1B32]/65 text-[#F5F0E6] text-xs font-medium ${className}`}
    >
      <Info className="w-3.5 h-3.5 text-[#E86B86] shrink-0" />
      <span>Giá trên chưa bao gồm thuế VAT</span>
    </div>
  );
}
