import { STATUS_META } from '../../utils/format';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status,
    className: 'bg-white/10 text-[#F5F0E6] border-white/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
