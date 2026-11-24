import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const STATUS_COLORS = {
  available: '#22C55E', // Xanh la - Trong
  booked: '#EF4444', // Do - Da dat
  selected: '#D4AF37', // Vang dong - Dang chon
  maintenance: '#6B7280', // Xam - Bao tri
};

const STATUS_TEXT = {
  available: 'Còn trống',
  booked: 'Đã đặt',
  selected: 'Đang chọn',
  maintenance: 'Bảo trì',
};

export default function TableMesh3D({
  table,
  hallType,
  isSelected,
  onSelect,
  selectable = true,
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const effectiveStatus = isSelected ? 'selected' : table.displayStatus || table.status || 'available';
  const color = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.available;
  const canClick = selectable && effectiveStatus !== 'booked' && effectiveStatus !== 'maintenance';

  const isRound = table.capacity <= 2;
  const tableWidth = isRound ? 1.15 : table.capacity >= 6 ? 2.1 : 1.55;
  const tableDepth = isRound ? 1.15 : 1.15;

  // Tinh vi tri ghe xung quanh ban theo suc chua
  const chairs = useMemo(() => {
    const cap = Math.min(Math.max(table.capacity || 2, 2), 8);
    if (isRound) {
      return [
        { pos: [-0.82, 0.35, 0], rot: [0, Math.PI / 2, 0] },
        { pos: [0.82, 0.35, 0], rot: [0, -Math.PI / 2, 0] },
      ];
    }

    const list = [];
    const perSide = Math.ceil(cap / 2);
    for (let i = 0; i < perSide; i++) {
      const offsetX = perSide === 1 ? 0 : ((i / (perSide - 1)) - 0.5) * (tableWidth - 0.55);
      list.push({ pos: [offsetX, 0.35, -tableDepth / 2 - 0.38], rot: [0, 0, 0] });
    }
    const bottomCount = cap - perSide;
    for (let i = 0; i < bottomCount; i++) {
      const offsetX = bottomCount === 1 ? 0 : ((i / (bottomCount - 1)) - 0.5) * (tableWidth - 0.55);
      list.push({ pos: [offsetX, 0.35, tableDepth / 2 + 0.38], rot: [0, Math.PI, 0] });
    }
    return list;
  }, [table.capacity, isRound, tableWidth, tableDepth]);

  useFrame(() => {
    if (!groupRef.current) return;
    const targetY = (table.posY || 0) + (hovered && canClick ? 0.14 : isSelected ? 0.1 : 0);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.14);
  });

  return (
    <group
      ref={groupRef}
      position={[table.posX, table.posY || 0, table.posZ]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (canClick) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (canClick && onSelect) {
          onSelect(table);
        }
      }}
    >
      {/* Vong phat sang trang thai duoi chan ban */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[isRound ? 0.92 : 1.2, isRound ? 1.08 : 1.38, 36]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected || hovered ? 1.2 : 0.65}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Chan ban */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.32, 0.74, 20]} />
        <meshStandardMaterial color="#23232D" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Mat ban */}
      {isRound ? (
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.64, 0.64, 0.09, 32]} />
          <meshStandardMaterial
            color="#1C1C24"
            metalness={0.35}
            roughness={0.28}
          />
        </mesh>
      ) : (
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[tableWidth, 0.09, tableDepth]} />
          <meshStandardMaterial
            color="#1C1C24"
            metalness={0.35}
            roughness={0.28}
          />
        </mesh>
      )}

      {/* Vien trang thai bao quanh mat ban */}
      {isRound ? (
        <mesh position={[0, 0.83, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.64, 0.025, 12, 36]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 1.1 : 0.55}
          />
        </mesh>
      ) : (
        <mesh position={[0, 0.832, 0]}>
          <boxGeometry args={[tableWidth + 0.04, 0.02, tableDepth + 0.04]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 0.9 : 0.45}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Nen vang nho giua ban */}
      <mesh position={[0, 0.91, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.14, 14]} />
        <meshStandardMaterial
          color="#FFF3D6"
          emissive="#FFBE55"
          emissiveIntensity={effectiveStatus === 'maintenance' ? 0.05 : 1.2}
        />
      </mesh>

      {/* Ghe ngoi quanh ban */}
      {chairs.map((c, idx) => (
        <group key={idx} position={c.pos} rotation={c.rot}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.38, 0.08, 0.38]} />
            <meshStandardMaterial color="#2C2522" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.3, -0.16]} castShadow>
            <boxGeometry args={[0.38, 0.44, 0.07]} />
            <meshStandardMaterial color="#352B26" roughness={0.55} />
          </mesh>
        </group>
      ))}

      {/* Vach ngan rieng tu cho Sanh VIP */}
      {hallType === 'vip' && (
        <group>
          {/* Vach ben trai va phai */}
          {[-1.55, 1.55].map((xPos, i) => (
            <group key={i} position={[xPos, 0.85, 0]}>
              <mesh>
                <boxGeometry args={[0.06, 1.65, 2.7]} />
                <meshStandardMaterial
                  color="#18151D"
                  transparent
                  opacity={0.58}
                  metalness={0.4}
                  roughness={0.2}
                />
              </mesh>
              <mesh position={[0, 0.84, 0]}>
                <boxGeometry args={[0.09, 0.05, 2.75]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Vach lung sau */}
          <mesh position={[0, 0.85, -1.35]}>
            <boxGeometry args={[3.1, 1.65, 0.06]} />
            <meshStandardMaterial
              color="#1A161F"
              transparent
              opacity={0.62}
              metalness={0.35}
              roughness={0.25}
            />
          </mesh>
        </group>
      )}

      {/* Nhan so ban + Tooltip khi re chuot */}
      <Html position={[0, 1.45, 0]} center distanceFactor={13} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center select-none">
          <div
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-lg border whitespace-nowrap transition-transform"
            style={{
              backgroundColor: isSelected ? '#D4AF37' : 'rgba(11, 11, 14, 0.88)',
              color: isSelected ? '#0B0B0E' : '#F5F0E6',
              borderColor: color,
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            Bàn {table.tableNumber}
          </div>

          {hovered && (
            <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#0B0B0E]/95 border border-[#D4AF37]/50 text-[11px] text-[#F5F0E6] shadow-2xl whitespace-nowrap">
              <div className="font-semibold text-[#D4AF37]">
                Bàn số {table.tableNumber} • {table.capacity} khách
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{STATUS_TEXT[effectiveStatus]}</span>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
