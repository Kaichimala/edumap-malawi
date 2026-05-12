import { calcScore, getNeedLevel, getRecommendedNew } from '../../utils/scoring'
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineChartBar, HiOutlineLocationMarker } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'
import { useSchools } from '../../hooks/useSchools'
import { useState, useEffect } from 'react'

const STAT_ICONS = {
  pop:   <HiOutlineUsers className="w-5 h-5 text-indigo-500" />,
  inst:  <HiOutlineOfficeBuilding className="w-5 h-5 text-brand-500" />,
  site:  <HiOutlineLocationMarker className="w-5 h-5 text-red-500"   />,
  pop:   <HiOutlineUsers className="w-5 h-5 text-blue-500" />,
}

export default function DetailPanel({ district, level, onClose }) {
  const { allSchools } = useSchools()
  
  // Filter by this district's ID so counts are district-specific, not national totals
  const districtSchools = (allSchools || []).filter(s => String(s.district_id) === String(district.id))
  const primaryCount   = districtSchools.filter(s => s.level?.toLowerCase() === 'primary').length
  const secondaryCount = districtSchools.filter(s => s.level?.toLowerCase() === 'secondary').length
  const tertiaryCount  = districtSchools.filter(s => s.level?.toLowerCase() === 'tertiary').length

  const pop  = level === 'primary'   ? district.p_age_pop   :
               level === 'secondary' ? district.s_age_pop   : district.t_age_pop
  const inst = level === 'primary'   ? primaryCount   :
               level === 'secondary' ? secondaryCount : tertiaryCount
  const score   = calcScore(pop, inst, level)
  const need    = getNeedLevel(score)
  const newInst = getRecommendedNew(pop, inst, level)
  const instLabel = level === 'tertiary' ? 'Institutions' : 'Schools'
  
  // States: Position, Size, Minimized
  const [position, setPosition] = useState({ x: 340, y: 16 }); // Initial: Right of sidebar
  const [width, setWidth] = useState(320); // Default width: 80 (320px)
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle')) return; // Don't drag if resizing
    setDragging(true);
    setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (resizing) {
      const newWidth = e.clientX - position.x;
      if (newWidth > 200 && newWidth < 600) {
        setWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, offset, position]);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col z-[3000] overflow-hidden transition-shadow ${isMinimized ? 'h-14' : 'h-[500px]'}`}
      style={{ 
        position: 'absolute', 
        left: position.x, 
        top: position.y, 
        width: isMinimized ? '200px' : `${width}px`,
        cursor: dragging ? 'grabbing' : 'auto'
      }}
    >
      {/* Drag/Header area */}
      <div 
        className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-100 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex flex-col gap-0.5 opacity-20 shrink-0">
             <div className="w-3 h-0.5 bg-slate-900 rounded-full"></div>
             <div className="w-3 h-0.5 bg-slate-900 rounded-full"></div>
          </div>
          <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest truncate">{district.name}</h2>
          {isMinimized && <span className="text-[10px] font-bold text-[#1a5276]">Minimized</span>}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200">
                Active Planning
              </span>
            </div>

      {/* Stats */}
      <div className="px-5 pb-5 space-y-3">
        <StatCard icon={STAT_ICONS.pop} label="Total Population" value={district.total_population?.toLocaleString() || 'N/A'} />
        <StatCard icon={STAT_ICONS.inst}  label={`Existing ${instLabel}`} value={inst} />
        <StatCard
          icon={STAT_ICONS.site}
          label={`Recommended New ${instLabel}`}
          value={newInst === 0 ? 'Sufficient' : `+${newInst}`}
          highlight={newInst > 0 ? '#1a5276' : '#16a34a'}
        />
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Level Breakdown Section */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">District Breakdown</p>
        <div className="grid grid-cols-3 gap-2">
           <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Primary</div>
             <div className="text-sm font-bold text-slate-700">{primaryCount}</div>
           </div>
           <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Secondary</div>
             <div className="text-sm font-bold text-slate-700">{secondaryCount}</div>
           </div>
           <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Tertiary</div>
             <div className="text-sm font-bold text-slate-700">{tertiaryCount}</div>
           </div>
        </div>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Sites note */}
      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Sites &amp; Schools</p>
        <p className="text-sm text-slate-400 italic">
          Click a marker on the map to explore individual schools and recommended sites.
        </p>
      </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {level} Level Context
            </p>
            <div 
              className="resize-handle w-4 h-4 cursor-nwse-resize flex flex-col items-end justify-end gap-0.5 opacity-20 hover:opacity-50 transition-opacity"
              onMouseDown={handleResizeMouseDown}
            >
              <div className="w-3 h-0.5 bg-slate-900 rounded-full rotate-[-45deg]"></div>
              <div className="w-1.5 h-0.5 bg-slate-900 rounded-full rotate-[-45deg]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold truncate" style={{ color: highlight || '#0f2d5c' }}>
          {value}
        </p>
      </div>
    </div>
  )
}
