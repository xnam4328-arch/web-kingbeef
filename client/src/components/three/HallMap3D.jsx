import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { RotateCcw, Grid, Box, Users } from 'lucide-react';
import TableMesh3D from './TableMesh3D';

function HallEnvironment({ hall }) {
  const hallType = hall?.type || 'indoor';
  const isTrain = hall?.name?.toLowerCase().includes('train');

  if (hallType === 'outdoor') {
    // Sanh May: ngoai troi thoang dang, bau troi sao, san go & den day vang
    return (
      <group>
        <Stars radius={45} depth={30} count={1400} factor={3.2} saturation={0.2} fade speed={0.5} />
        <Sparkles count={45} scale={[16, 4, 14]} position={[0, 3.6, 0]} size={3.2} color="#FFD27D" speed={0.2} />
        {/* San go ngoai troi */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[18, 14]} />
          <meshStandardMaterial color="#1E1A18" roughness={0.85} metalness={0.1} />
        </mesh>
        {/* Lan can kinh thap bao quanh */}
        {[
          { pos: [0, 0.45, -6.9], size: [18, 0.9, 0.08] },
          { pos: [-8.9, 0.45, 0], size: [0.08, 0.9, 14] },
          { pos: [8.9, 0.45, 0], size: [0.08, 0.9, 14] },
        ].map((rail, i) => (
          <mesh key={i} position={rail.pos}>
            <boxGeometry args={rail.size} />
            <meshStandardMaterial color="#94A3B8" transparent opacity={0.22} metalness={0.5} roughness={0.1} />
          </mesh>
        ))}
        {/* 4 cot den day vang o 4 goc */}
        {[
          [-8, -6],
          [8, -6],
          [-8, 6],
          [8, 6],
        ].map(([x, z], idx) => (
          <group key={idx} position={[x, 0, z]}>
            <mesh position={[0, 2, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 4, 12]} />
              <meshStandardMaterial color="#27272A" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 4.05, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#FFF3D6" emissive="#FFBE55" emissiveIntensity={1.8} />
            </mesh>
            {/* Chau cay xanh goc sanh */}
            <mesh position={[0.45 * (x > 0 ? -1 : 1), 0.35, 0.45 * (z > 0 ? -1 : 1)]}>
              <cylinderGeometry args={[0.38, 0.28, 0.7, 16]} />
              <meshStandardMaterial color="#2A2624" roughness={0.8} />
            </mesh>
            <mesh position={[0.45 * (x > 0 ? -1 : 1), 1.05, 0.45 * (z > 0 ? -1 : 1)]}>
              <dodecahedronGeometry args={[0.58, 0]} />
              <meshStandardMaterial color="#1F4D36" roughness={0.85} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* San nha trong nha / VIP */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[21, 16]} />
        <meshStandardMaterial
          color={hallType === 'vip' ? '#121017' : '#15141A'}
          roughness={hallType === 'vip' ? 0.3 : 0.6}
          metalness={hallType === 'vip' ? 0.35 : 0.15}
        />
      </mesh>

      {/* Tham trung tam anh vang dong nhe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[17.5, 12.5]} />
        <meshStandardMaterial color="#1B1922" roughness={0.85} />
      </mesh>

      {/* Tuong hau & duong chi vang sang trong */}
      <mesh position={[0, 2.2, -7.8]}>
        <boxGeometry args={[21, 4.4, 0.2]} />
        <meshStandardMaterial color="#101015" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.2, -7.66]}>
        <boxGeometry args={[18, 0.06, 0.05]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} emissive="#7A5F12" emissiveIntensity={0.4} />
      </mesh>

      {/* Vom vang dac trung cho Sanh Train to Love */}
      {isTrain &&
        [-5, -2.5, 0, 2.5, 5].map((zPos, i) => (
          <mesh key={i} position={[0, 0.2, zPos]} rotation={[0, 0, 0]}>
            <torusGeometry args={[5.8, 0.055, 12, 48, Math.PI]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.25} />
          </mesh>
        ))}

      {/* Den tuong vang am */}
      {[-6, -2, 2, 6].map((xPos, i) => (
        <mesh key={i} position={[xPos, 2.65, -7.6]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial color="#FFF4D6" emissive="#FFB84D" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function HallMap3D({
  hall,
  tables = [],
  selectedTableId,
  onSelectTable,
  selectable = true,
  heightClass = 'h-[500px]',
}) {
  const controlsRef = useRef();
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'grid'

  const hallType = hall?.type || 'indoor';
  const cameraPos = useMemo(() => {
    if (hallType === 'vip') return [0, 12.5, 12.5];
    if (hallType === 'outdoor') return [0, 10.5, 11.5];
    return [0, 11.5, 12];
  }, [hallType]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="space-y-3">
      {/* Thanh trang thai & Dieu khien */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#16161C]/90 border border-[#D4AF37]/20">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
            <span>Trống</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
            <span>Đã đặt</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
            <span>Đang chọn</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#6B7280]" />
            <span>Bảo trì</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === '3d' && (
            <button
              type="button"
              onClick={handleResetCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#0B0B0E] border border-white/10 hover:border-[#D4AF37]/50 text-[#F5F0E6]/85 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              Đặt lại góc nhìn
            </button>
          )}
          <div className="inline-flex rounded-lg bg-[#0B0B0E] p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === '3d' ? 'bg-[#D4AF37] text-[#0B0B0E]' : 'text-[#F5F0E6]/70'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Sơ đồ 3D
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-[#D4AF37] text-[#0B0B0E]' : 'text-[#F5F0E6]/70'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Danh sách bàn
            </button>
          </div>
        </div>
      </div>

      {/* Khu vuc hien thi 3D hoac Grid */}
      {viewMode === '3d' ? (
        <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-[#D4AF37]/25 bg-[#09090D]`}>
          <Canvas
            shadows
            camera={{ position: cameraPos, fov: 44 }}
            dpr={[1, 2]}
          >
            <color attach="background" args={[hallType === 'outdoor' ? '#070B14' : '#0B0B0E']} />
            <fog
              attach="fog"
              args={[hallType === 'outdoor' ? '#070B14' : '#0B0B0E', 16, 36]}
            />

            {/* He thong anh sang theo loai sanh */}
            <ambientLight
              intensity={hallType === 'outdoor' ? 0.42 : 0.55}
              color={hallType === 'outdoor' ? '#BFD4FF' : '#FFE7C4'}
            />
            <directionalLight
              position={[6, 12, 8]}
              intensity={hallType === 'outdoor' ? 1.0 : 1.3}
              color={hallType === 'outdoor' ? '#DCE8FF' : '#FFE1B0'}
              castShadow
            />
            <pointLight position={[0, 6.5, 0]} intensity={1.8} color="#FFD27D" distance={26} />
            <pointLight position={[-6, 4, 4]} intensity={0.9} color="#D4AF37" distance={18} />
            <pointLight position={[6, 4, -3]} intensity={0.9} color="#FFB85C" distance={18} />

            <HallEnvironment hall={hall} />

            {tables.map((table) => (
              <TableMesh3D
                key={table.id}
                table={table}
                hallType={hallType}
                isSelected={selectedTableId === table.id}
                onSelect={onSelectTable}
                selectable={selectable}
              />
            ))}

            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.07}
              minDistance={5}
              maxDistance={24}
              maxPolarAngle={Math.PI / 2.25}
              minPolarAngle={0.25}
            />
          </Canvas>

          {/* Huong dan tuong tac goc duoi */}
          <div className="pointer-events-none absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0B0B0E]/80 backdrop-blur border border-white/10 text-[11px] text-[#F5F0E6]/75">
            Kéo chuột để xoay • Cuộn để phóng to/thu nhỏ • Rê chuột xem sức chứa • Click chọn bàn
          </div>

          {hall && (
            <div className="pointer-events-none absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[#0B0B0E]/85 backdrop-blur border border-[#D4AF37]/30 text-xs">
              <span className="font-serif font-semibold text-[#D4AF37]">{hall.name}</span>
              <span className="text-[#F5F0E6]/60 ml-2">
                {hall.type === 'outdoor'
                  ? 'Ngoài trời (Outdoor)'
                  : hall.type === 'vip'
                  ? 'Phòng / Vách ngăn VIP'
                  : 'Trong nhà (Ánh sáng ấm)'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#16161C]/70 border border-[#D4AF37]/20">
          {tables.map((table) => {
            const st =
              selectedTableId === table.id
                ? 'selected'
                : table.displayStatus || table.status || 'available';
            const disabled = !selectable || st === 'booked' || st === 'maintenance';
            const borderColor =
              st === 'selected'
                ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                : st === 'booked'
                ? 'border-red-500/40 bg-red-500/10 opacity-75'
                : st === 'maintenance'
                ? 'border-gray-500/40 bg-gray-500/10 opacity-60'
                : 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400';

            return (
              <button
                key={table.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectTable && onSelectTable(table)}
                className={`p-3.5 rounded-xl border text-left transition-all ${borderColor} ${
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
                }`}
              >
                <div className="font-serif font-bold text-base text-[#F5F0E6]">
                  Bàn {table.tableNumber}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-[#F5F0E6]/75">
                  <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {table.capacity} khách
                </div>
                <div className="mt-1.5 text-[11px] font-medium">
                  {st === 'selected' && <span className="text-[#D4AF37]">Đang chọn</span>}
                  {st === 'available' && <span className="text-emerald-400">Còn trống</span>}
                  {st === 'booked' && <span className="text-red-400">Đã đặt</span>}
                  {st === 'maintenance' && <span className="text-gray-400">Bảo trì</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
