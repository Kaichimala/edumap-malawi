import MapView from '../components/Map/MapView.tsx'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useData } from '../contexts/DataContext'
import { calcScore, getNeedLevel } from '../utils/scoring'
import { useState, useEffect, useRef } from 'react'
import { HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineRefresh } from 'react-icons/hi'

export default function MapViewPage() {
  const { 
    districts, 
    loading, 
    selectedDistrictId, 
    setSelectedDistrictId, 
    level, 
    setLevel 
  } = useDistricts()

  const { runSpatialAnalysis, clearAnalysisSites, analysisSites } = useData()

  const selectedDistrict = districts.find(d => String(d.id) === String(selectedDistrictId))
  
  const handleSelect = (d) => {
    if (isAnalyzed) {
      setIsAnalyzed(false)
      clearAnalysisSites()
      analyzedLevelRef.current = null
    }
    setSelectedDistrictId(d ? d.id : null)
  }
  
  const [isAnalyzed, setIsAnalyzed] = useState(() => {
    return sessionStorage.getItem('edumap_is_analyzed_map') === 'true'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isBuildMode, setIsBuildMode] = useState(false)
  const [isDestroyMode, setIsDestroyMode] = useState(false)
  const [showSites, setShowSites] = useState(true)
  const [visibleLevels, setVisibleLevels] = useState(['primary', 'secondary', 'tertiary'])
  const [isLegendMinimized, setIsLegendMinimized] = useState(false)
  const [legendPos, setLegendPos] = useState({ x: 0, y: 0 }) 
  const [legendWidth, setLegendWidth] = useState(200)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const legendRef = useRef(null)
  const mapContainerRef = useRef(null)
  const requestRef = useRef(null)

  // Track the level that was last analyzed
  const analyzedLevelRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem('edumap_is_analyzed_map', isAnalyzed)
  }, [isAnalyzed])


  const handleStartAnalysis = async () => {
    if (!selectedDistrict) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    
    // Fake progress for UI feedback since the engine is now sync/fast
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        return prev + 5;
      });
    }, 50);

    try {
      await runSpatialAnalysis(selectedDistrict.id, selectedDistrict);
      setProgress(100);
      setTimeout(() => {
        clearInterval(timer);
        setIsAnalyzing(false);
        setIsAnalyzed(true);
        setShowSites(true);
      }, 300);
    } catch (err) {
      console.error("Analysis failed:", err);
      clearInterval(timer);
      setIsAnalyzing(false);
    }
  };

  const handleClearAnalysis = () => {
    setIsAnalyzed(false)
    setShowSites(false)
    clearAnalysisSites()
    analyzedLevelRef.current = null
    // Also reset to the very beginning (pre-district selection)
    setSelectedDistrictId(null)
  }


  // Draggable logic with containment and smoothness
  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle')) return;
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - legendPos.x,
        y: e.clientY - legendPos.y
      };
    }
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    // Initial position: Top Right
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      setLegendPos({ x: rect.width - 220, y: 16 });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!mapContainerRef.current || !legendRef.current) return;
      
      if (isDragging) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => {
          const parent = mapContainerRef.current.getBoundingClientRect();
          const legend = legendRef.current.getBoundingClientRect();
          
          let newX = e.clientX - dragOffset.current.x;
          let newY = e.clientY - dragOffset.current.y;
          
          newX = Math.max(0, Math.min(newX, parent.width - legend.width));
          newY = Math.max(0, Math.min(newY, parent.height - legend.height));
          
          setLegendPos({ x: newX, y: newY });
        });
      } else if (isResizing) {
        const newWidth = e.clientX - legendPos.x;
        if (newWidth > 180 && newWidth < 400) {
          setLegendWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDragging, isResizing, legendPos.x, legendPos.y]);

  // When district changes, clear old analysis
  useEffect(() => {
    if (isAnalyzed) {
      setIsAnalyzed(false)
      clearAnalysisSites()
      analyzedLevelRef.current = null
    }
  }, [selectedDistrictId])

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium tracking-widest">Initialising Spatial Data Engine...</div>

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
      
      {/* Left Panel */}
      <MapDistrictSidebar 
        districts={districts}
        level={level}
        selectedDistrict={selectedDistrict}
        onSelect={handleSelect}
        isBuildMode={isBuildMode}
        setIsBuildMode={setIsBuildMode}
        isDestroyMode={isDestroyMode}
        setIsDestroyMode={setIsDestroyMode}
        isAnalyzed={isAnalyzed}
        isAnalyzing={isAnalyzing}
        progress={progress}
        handleStartAnalysis={handleStartAnalysis}
        handleClearAnalysis={handleClearAnalysis}
        showSites={showSites}
        setShowSites={setShowSites}
      />

      {/* Center: Map */}
      <div ref={mapContainerRef} className="flex-1 relative group overflow-hidden">
        <div 
          ref={legendRef}
          className={`absolute z-[2000] flex flex-col gap-2 ${isDragging ? '' : 'transition-all duration-75'}`}
          style={{ 
            top: 0,
            left: 0,
            transform: `translate(${legendPos.x}px, ${legendPos.y}px)`,
            cursor: isDragging ? 'grabbing' : 'auto',
            userSelect: 'none',
            willChange: 'transform'
          }}
        >
          {/* Floating Level Toggle (Primary Selector) */}
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-xl flex gap-1 border border-white/50 self-end">
            {['primary', 'secondary', 'tertiary'].map(l => (
              <button
                key={l}
                onClick={() => {
                  setLevel(l);
                  if (!visibleLevels.includes(l)) setVisibleLevels([...visibleLevels, l]);
                }}
                className={`px-4 py-1.5 text-[10px] font-black rounded-lg capitalize transition-all tracking-widest ${
                  level === l ? 'bg-[#1a5276] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          
          {/* Unified Map Legend & Context */}
          <div 
            ref={legendRef}
            className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 flex flex-col transition-all duration-300 overflow-hidden ${isLegendMinimized ? 'h-12' : 'pb-3'}`}
            style={{ width: isLegendMinimized ? '180px' : `${legendWidth}px` }}
          >
            <div 
              className="drag-handle flex items-center justify-between cursor-grab active:cursor-grabbing px-3 py-2.5 bg-slate-50/50 border-b border-slate-100 select-none"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex flex-col gap-0.5 opacity-20 shrink-0">
                  <div className="w-2.5 h-0.5 bg-slate-900 rounded-full"></div>
                  <div className="w-2.5 h-0.5 bg-slate-900 rounded-full"></div>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">Infrastructure Key</h4>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                {!isLegendMinimized && (
                  <button 
                    onClick={() => setVisibleLevels(visibleLevels.length === 3 ? [level] : ['primary', 'secondary', 'tertiary'])}
                    className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-tighter mr-1"
                  >
                    {visibleLevels.length === 3 ? 'Reset' : 'All'}
                  </button>
                )}
                <button 
                  onClick={() => setIsLegendMinimized(!isLegendMinimized)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  {isLegendMinimized ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isLegendMinimized && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-3 flex-1 flex flex-col min-h-0">
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {[
                    { id: 'primary', label: 'Primary Schools', color: 'bg-blue-500' },
                    { id: 'secondary', label: 'Secondary Schools', color: 'bg-green-500' },
                    { id: 'tertiary', label: 'Tertiary Institutions', color: 'bg-purple-500' }
                  ].map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between group cursor-pointer p-1 rounded-lg transition-colors ${visibleLevels.includes(item.id) ? 'bg-slate-50' : 'opacity-40 grayscale hover:grayscale-0'}`}
                      onClick={() => {
                        if (visibleLevels.includes(item.id)) {
                          if (visibleLevels.length > 1) setVisibleLevels(visibleLevels.filter(v => v !== item.id));
                        } else {
                          setVisibleLevels([...visibleLevels, item.id]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0 ${item.color}`}></div>
                        <span className="text-[11px] font-bold text-slate-600">{item.label}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={visibleLevels.includes(item.id)} 
                        className="w-3 h-3 accent-[#1a5276]"
                      />
                    </div>
                  ))}
                </div>

                {showSites && isAnalyzed && (() => {
                  const siteCount = analysisSites?.[level]?.length || 0;
                  const pop = level === 'primary' ? selectedDistrict?.p_age_pop : level === 'secondary' ? selectedDistrict?.s_age_pop : selectedDistrict?.t_age_pop;
                  const need = getNeedLevel(calcScore(pop, siteCount, level));
                  
                  return (
                    <div className="pt-2 mt-0.5 border-t border-slate-100 space-y-2">
                       <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded bg-red-500 shadow-sm flex items-center justify-center shrink-0">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-black text-red-600">
                          {siteCount} Recommended Site{siteCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Need Level</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: need.color }}>
                          {need.label}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-2 mt-auto border-t border-slate-100/50">
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
        </div>

        <MapView
          districts={districts}
          selectedDistrict={selectedDistrict}
          level={level}
          onSelect={handleSelect}
          showMarkers={true}
          showSites={showSites}
          isBuildMode={isBuildMode}
          setIsBuildMode={setIsBuildMode}
          isDestroyMode={isDestroyMode}
          setIsDestroyMode={setIsDestroyMode}
          isAnalyzed={isAnalyzed}
          visibleLevels={visibleLevels} // Pass visibility array
        />

        {/* Spatial Analysis floating button — always visible */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000]">
          {isAnalyzing ? (
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-lg text-sm font-semibold text-[#1a5276]">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1a5276" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Analysing… {progress}%
            </div>
          ) : isAnalyzed ? (
            <button
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-slate-50 active:scale-95 transition-all"
            >
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
              Re-run Analysis
              <HiOutlineRefresh className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1a5276] text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-[#154360] active:scale-95 transition-all"
            >
              <HiOutlineChartBar className="w-4 h-4" />
              Start Spatial Analysis
            </button>
          )}
        </div>
      </div>

      {/* Right Panel */}
      {selectedDistrict && (
        <DetailPanel
          district={selectedDistrict}
          level={level}
          onClose={() => handleSelect(null)}
        />
      )}
    </div>
  )
}
