import MapView from '../components/Map/MapView'
import MapDistrictSidebar from '../components/Map/MapDistrictSidebar'
import DetailPanel from '../components/DetailPanel/DetailPanel'
import { useDistricts } from '../hooks/useDistricts'
import { useSuitability } from '../hooks/useSuitability'
import { useState, useEffect, useCallback } from 'react'
import { HiOutlineChartBar, HiOutlineDownload } from 'react-icons/hi'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export default function MapViewPage() {
  const { districts, loading } = useDistricts()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [level, setLevel] = useState('primary')
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [criteria, setCriteria] = useState({
    road_weight: 0.5,
    river_weight: 0.5,
    population_weight: 0.5,
    slope_weight: 0.5,
  })
  const { data: suitabilityData, loading: suitabilityLoading, fetchSuitability, clearData } = useSuitability()

  // Define BEFORE the useEffect that references it to avoid temporal dead zone
  const triggerAnalysis = useCallback((districtId) => {
    setIsAnalyzing(true)
    setProgress(0)

    const duration = 3000
    const interval = 50
    const steps = duration / interval
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setProgress(Math.min(95, Math.round((currentStep / steps) * 100)))
      if (currentStep >= steps) clearInterval(timer)
    }, interval)

    fetchSuitability({
      district_id: districtId,
      level: level,
      ...criteria,
    }).then(() => {
      clearInterval(timer)
      setProgress(100)
      setTimeout(() => {
        setIsAnalyzing(false)
        setIsAnalyzed(true)
      }, 400)
    }).catch(() => {
      clearInterval(timer)
      setIsAnalyzing(false)
    })
  }, [level, criteria, fetchSuitability])

  // Auto-run analysis when a district is selected or school level changes
  useEffect(() => {
    if (!selectedDistrict) return
    setIsAnalyzed(false)
    clearData()
    triggerAnalysis(selectedDistrict.id)
  }, [selectedDistrict, level, clearData, triggerAnalysis])


  const handleStartAnalysis = () => {
    if (!selectedDistrict) return
    triggerAnalysis(selectedDistrict.id)
  }

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district)
  }

  const [pdfLoading, setPdfLoading] = useState(false)

  // PDF report: capture live map screenshot + data table
  const handleDownloadReport = async () => {
    if (!suitabilityData || !selectedDistrict || pdfLoading) return
    setPdfLoading(true)

    try {
    const now = new Date().toISOString().split('T')[0]  // YYYY-MM-DD — locale-safe
      const features = (suitabilityData.features || []).filter(
        f => f.properties?.feature_type === 'point' || !f.properties?.feature_type
      )
      const meta = suitabilityData.metadata || {}

      // ── Step 1: Capture the live map (buffers + markers visible) ──────
      const mapEl = document.getElementById('map-capture-area')
      let mapImgData = null
      let mapW = 0, mapH = 0
      if (mapEl) {
        // Brief delay so any tooltips / hover states clear
        await new Promise(r => setTimeout(r, 200))
        const canvas = await html2canvas(mapEl, {
          useCORS:     true,
          allowTaint:  true,
          backgroundColor: '#f8fafc',
          scale: 2,
          ignoreElements: el => el.classList.contains('export-ignore'),
        })
        mapImgData = canvas.toDataURL('image/png')
        mapW = canvas.width
        mapH = canvas.height
      }

      // ── Step 2: Build PDF ──────────────────────────────────────────────
      const PAGE_W  = 210  // A4 mm
      const PAGE_H  = 297
      const MARGIN  = 14
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // ── PAGE 1: Cover / Summary ────────────────────────────────────────
      // Header bar
      doc.setFillColor(26, 82, 118)
      doc.rect(0, 0, PAGE_W, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text('EduMap Malawi — Suitability Analysis Report', MARGIN, 12)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Ministry of Education · Spatial Planning & MIS', MARGIN, 20)

      doc.setTextColor(30, 41, 59)

      // District info block
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(MARGIN, 34, PAGE_W - MARGIN * 2, 36, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(selectedDistrict.name + ' District', MARGIN + 4, 44)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`School Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`, MARGIN + 4, 52)
      doc.text(`Generated:    ${now}`, MARGIN + 4, 58)
      doc.text(`Candidates Evaluated: ${meta.total_candidates_evaluated ?? 'N/A'}  |  Top Sites: ${meta.top_sites_returned ?? features.length}  |  Buffer Zones: ${meta.buffer_zones_generated ?? features.length}`, MARGIN + 4, 64)

      // Weights
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Analysis Weights (PyLUSAT Criteria)', MARGIN, 82)
      doc.setDrawColor(226, 232, 240)
      doc.line(MARGIN, 84, PAGE_W - MARGIN, 84)

      const weights = [
        ['Road Accessibility', criteria.road_weight],
        ['Water Proximity',    criteria.river_weight],
        ['Population Need',    criteria.population_weight],
        ['Terrain Slope',      criteria.slope_weight],
      ]
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      weights.forEach(([label, val], i) => {
        const col = i < 2 ? MARGIN : MARGIN + 90
        const row = i < 2 ? 92 + i * 8 : 92 + (i - 2) * 8
        doc.text(`${label}:`, col, row)
        doc.setFont('helvetica', 'bold')
        doc.text(String(val), col + 52, row)
        doc.setFont('helvetica', 'normal')
      })

      // Colour legend
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Suitability Tier Legend', MARGIN, 118)
      doc.line(MARGIN, 120, PAGE_W - MARGIN, 120)
      const tiers = [
        ['High Priority (≥75%)',   [22,  163, 74]],
        ['Medium Priority (50-74%)', [202, 138, 4]],
        ['Lower Priority (<50%)',  [220,  38, 38]],
      ]
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      tiers.forEach(([label, rgb], i) => {
        const y = 128 + i * 9
        doc.setFillColor(...rgb)
        doc.circle(MARGIN + 2, y - 2, 2.5, 'F')
        doc.setTextColor(30, 41, 59)
        doc.text(label, MARGIN + 8, y)
      })

      doc.setTextColor(30, 41, 59)

      // Proximity Analysis Summary
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Proximity Analysis Summary', MARGIN, 158)
      doc.setDrawColor(226, 232, 240)
      doc.line(MARGIN, 160, PAGE_W - MARGIN, 160)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const proxStats = [
        ['Existing Schools in District', meta.existing_schools_in_district ?? 'N/A'],
        ['Underserved Zones (no nearby school)', meta.underserved_zones ?? 'N/A'],
        ['Overlapping Buffer Zones', meta.overlapping_zones ?? 'N/A'],
        ['District Area', `${meta.district_area_km2 ?? '?'} km²`],
        ['Buffer Coverage Area', `${meta.buffer_coverage_km2 ?? '?'} km²`],
        ['Buffer Coverage of District', `${meta.buffer_coverage_pct ?? '?'}%`],
      ]
      proxStats.forEach(([label, val], i) => {
        const col = i < 3 ? MARGIN : MARGIN + 90
        const row = i < 3 ? 168 + i * 7 : 168 + (i - 3) * 7
        doc.text(`${label}:`, col, row)
        doc.setFont('helvetica', 'bold')
        doc.text(String(val), col + 62, row)
        doc.setFont('helvetica', 'normal')
      })

      // Footer note on page 1
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text('Map screenshot and detailed results table follow on subsequent pages.', MARGIN, 200)
      doc.text('EduMap Malawi MIS · Spatial Planning Tool', MARGIN, PAGE_H - 8)

      // ── PAGE 2: Map Screenshot ─────────────────────────────────────────
      if (mapImgData) {
        doc.addPage()

        // Header bar
        doc.setFillColor(26, 82, 118)
        doc.rect(0, 0, PAGE_W, 18, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(`${selectedDistrict.name} — Suitability Buffer Map`, MARGIN, 12)

        // Fit image to page width maintaining aspect ratio
        const aspectRatio = mapH / mapW
        const imgW = PAGE_W - MARGIN * 2
        const imgH = imgW * aspectRatio
        const maxH = PAGE_H - 30   // leave space for header + footer
        const finalH = Math.min(imgH, maxH)
        const finalW = finalH / aspectRatio

        doc.addImage(mapImgData, 'PNG', MARGIN, 22, finalW, finalH)

        doc.setFont('helvetica', 'italic')
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text('Green = High Priority (≥75%)  |  Amber = Medium (50-74%)  |  Red = Lower (<50%)  |  Dashed rings = Buffer catchment zones', MARGIN, PAGE_H - 8)
      }

      // ── PAGE 3+: Data Table ────────────────────────────────────────────
      doc.addPage()

      doc.setFillColor(26, 82, 118)
      doc.rect(0, 0, PAGE_W, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`${selectedDistrict.name} — Top Recommended Sites`, MARGIN, 12)

      doc.setTextColor(30, 41, 59)

      const headers   = ['#', 'Score', 'Road Score', 'Water Score', 'Slope Score', 'Dist Road (m)', 'Dist Water (m)', 'Slope (°)', 'Lat', 'Lng']
      const colWidths = [8,    16,      18,           18,            18,             22,               22,               14,          20,    20]
      let y = 28

      // Table header row
      doc.setFillColor(241, 245, 249)
      doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      let x = MARGIN
      headers.forEach((h, i) => { doc.text(h, x + 1, y); x += colWidths[i] })
      y += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)

      features.slice(0, 30).forEach((feat, idx) => {
        if (y > PAGE_H - 14) {
          doc.addPage()
          y = 20
          // Repeat header
          doc.setFillColor(241, 245, 249)
          doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 7, 'F')
          doc.setFont('helvetica', 'bold')
          x = MARGIN
          headers.forEach((h, i) => { doc.text(h, x + 1, y); x += colWidths[i] })
          y += 6
          doc.setFont('helvetica', 'normal')
        }

        // Alternating row shading
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 6, 'F')
        }

        const p = feat.properties
        const [lng, lat] = feat.geometry.coordinates
        const score = p.suitability_score

        // Only colour the score column (i === 1), keep rank column dark
        const rgb = score >= 75 ? [22, 163, 74] : score >= 50 ? [202, 138, 4] : [220, 38, 38]
        doc.setTextColor(30, 41, 59)  // default dark for rank column

        x = MARGIN
        const row = [
          `#${idx + 1}`,
          `${score}%`,
          `${p.road_score ?? '-'}`,
          `${p.water_score ?? '-'}`,
          `${p.slope_score ?? '-'}`,
          `${p.dist_road_m ?? '-'}`,
          `${p.dist_water_m ?? '-'}`,
          `${p.slope_deg ?? '-'}`,
          lat.toFixed(4),
          lng.toFixed(4),
        ]
        row.forEach((val, i) => {
          if (i === 1) doc.setTextColor(...rgb)  // score col only
          if (i > 1)  doc.setTextColor(30, 41, 59)
          doc.text(String(val), x + 1, y)
          x += colWidths[i]
        })
        doc.setTextColor(30, 41, 59)
        y += 6
      })

      // Final footer
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('EduMap Malawi MIS · Ministry of Education Spatial Planning Tool', MARGIN, PAGE_H - 8)

      doc.save(`suitability_${selectedDistrict.name.toLowerCase()}_${now}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) return (
    <div className="p-8 text-center text-slate-500 animate-pulse font-medium tracking-widest">
      Initialising Spatial Data Engine...
    </div>
  )

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">

      {/* Left Panel: District List */}
      <MapDistrictSidebar
        districts={districts}
        level={level}
        selectedDistrict={selectedDistrict}
        onSelect={handleDistrictSelect}
        criteria={criteria}
        onCriteriaChange={setCriteria}
        onRerun={handleStartAnalysis}
        suitabilityLoading={suitabilityLoading}
      />

      {/* Center: Map */}
      <div className="flex-1 relative group">
        {/* Floating Level Toggle */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-xl flex gap-1 border border-white/50">
          {['primary', 'secondary', 'tertiary'].map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-4 py-1.5 text-[10px] font-black rounded-lg capitalize transition-all tracking-widest ${level === l ? 'bg-[#1a5276] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Download PDF button — appears when analysis is complete */}
        {isAnalyzed && suitabilityData && (
          <button
            onClick={handleDownloadReport}
            disabled={pdfLoading}
            className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 bg-[#1a5276] text-white px-4 py-2.5 rounded-xl shadow-xl hover:bg-[#154360] transition-all text-sm font-bold active:scale-95 disabled:opacity-70 disabled:cursor-wait export-ignore"
          >
            {pdfLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Capturing map...
              </>
            ) : (
              <>
                <HiOutlineDownload className="w-4 h-4" />
                Download PDF Report
              </>
            )}
          </button>
        )}

        <MapView
          districts={districts}
          selectedDistrict={selectedDistrict}
          level={level}
          onSelect={handleDistrictSelect}
          showMarkers={isAnalyzed}
          suitabilityData={suitabilityData}
        />

        {/* Analysis Overlay — shown only before first district is selected OR while running */}
        {(!isAnalyzed || isAnalyzing) && (
          <div className={`absolute inset-0 z-[2000] flex items-center justify-center transition-all duration-700 ${isAnalyzing ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-slate-900/10 backdrop-blur-[2px]'}`}>
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center transform transition-transform border border-slate-100">
              {isAnalyzing ? (
                <div className="space-y-5">
                  <div className="relative w-20 h-20 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="45" fill="none" stroke="#1a5276" strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#1a5276]">
                      {progress}%
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedDistrict ? `Analysing ${selectedDistrict.name}...` : 'Processing GIS Layers'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2">
                      {progress < 25 ? 'Loading district boundary...' :
                        progress < 50 ? 'Computing road & water distances...' :
                          progress < 80 ? 'Extracting terrain slope from DEM...' : 'Applying weighted suitability model...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="w-16 h-16 bg-blue-50 text-[#1a5276] rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
                    <HiOutlineChartBar />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Spatial Need Analysis</h3>
                    <p className="text-slate-500 mt-1.5 text-xs leading-relaxed">
                      Select a district from the sidebar to automatically run the PyLUSAT suitability engine.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Detail Panel */}
      {selectedDistrict && (
        <DetailPanel
          district={selectedDistrict}
          level={level}
          onClose={() => setSelectedDistrict(null)}
        />
      )}
    </div>
  )
}
