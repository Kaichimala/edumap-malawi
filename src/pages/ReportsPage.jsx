import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { useDistricts } from '../hooks/useDistricts'
import { calcScore, getNeedLevel } from '../utils/scoring'

export default function ReportsPage() {
  const { districts, loading } = useDistricts()
  const [exporting, setExporting] = useState(null) // 'national' | 'district'
  const [selectedDistrictId, setSelectedDistrictId] = useState('')

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Shared PDF helpers ────────────────────────────────────────
  const drawHeader = (pdf, W, M, rightTitle, subtitle) => {
    pdf.setFillColor(26, 82, 118)
    pdf.rect(0, 0, W, 8, 'F')
    pdf.setFillColor(248, 250, 252)
    pdf.rect(0, 8, W, 68, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(26, 82, 118)
    pdf.text('EduMap Malawi', M, 34)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Ministry of Education — GIS Infrastructure Planning System', M, 48)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.setTextColor(15, 23, 42)
    pdf.text(rightTitle, W - M, 32, { align: 'right' })

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(100, 116, 139)
    pdf.text(subtitle, W - M, 46, { align: 'right' })
    pdf.text(`Generated: ${dateStr}`, W - M, 58, { align: 'right' })

    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    pdf.line(M, 76, W - M, 76)
  }

  const drawFooter = (pdf, W, H, M) => {
    pdf.setFillColor(26, 82, 118)
    pdf.rect(0, H - 22, W, 22, 'F')
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(255, 255, 255)
    pdf.text('EduMap Malawi MIS — Confidential Planning Document', M, H - 8)
    pdf.text('Data sourced from MoE Spatial Database', W - M, H - 8, { align: 'right' })
  }

  // ── National Report ───────────────────────────────────────────
  const exportNational = () => {
    setExporting('national')
    try {
      const sorted = [...districts]
        .map(d => ({ ...d, score: calcScore(Number(d.p_age_pop) || 0, Number(d.p_schools) || 0, 'primary') }))
        .sort((a, b) => b.score - a.score)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const W = 595.28, H = 841.89, M = 40, CW = W - M * 2

      drawHeader(pdf, W, M, 'National Infrastructure Report', 'All Districts · Primary Level Need Analysis')

      let y = 92
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(15, 23, 42)
      pdf.text('District Need Score Rankings', M, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(100, 116, 139)
      pdf.text(`${sorted.length} districts ranked by primary school need score (highest priority first)`, M, y + 13)
      y += 28

      // Table header
      const cols = [
        { label: '#',               w: 25  },
        { label: 'District',        w: 130 },
        { label: 'Primary Schools', w: 90  },
        { label: 'Secondary',       w: 80  },
        { label: 'Tertiary',        w: 70  },
        { label: 'Need Score',      w: 75  },
        { label: 'Priority',        w: 65  },
      ]

      pdf.setFillColor(26, 82, 118)
      pdf.rect(M, y, CW, 20, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(255, 255, 255)
      let x = M + 5
      cols.forEach(c => { pdf.text(c.label, x, y + 13); x += c.w })
      y += 20

      sorted.forEach((d, i) => {
        if (y > H - 80) {
          pdf.addPage()
          y = 40
        }
        const need = getNeedLevel(d.score)
        const even = i % 2 === 0
        pdf.setFillColor(even ? 248 : 255, even ? 250 : 255, even ? 252 : 255)
        pdf.rect(M, y, CW, 18, 'F')

        const needColor = need.label === 'Critical' ? [220,38,38]
          : need.label === 'High' ? [234,88,12]
          : need.label === 'Medium' ? [202,138,4]
          : [22,163,74]

        const cells = [
          { text: String(i + 1),               color: [100,116,139], bold: false },
          { text: d.name,                       color: [15,23,42],   bold: false },
          { text: String(d.p_schools || 0),     color: [71,85,105],  bold: false },
          { text: String(d.s_schools || 0),     color: [71,85,105],  bold: false },
          { text: String(d.t_institutions || 0),color: [71,85,105],  bold: false },
          { text: d.score.toFixed(1),           color: [26,82,118],  bold: true  },
          { text: need.label,                   color: needColor,    bold: true  },
        ]

        x = M + 5
        cells.forEach((cell, j) => {
          pdf.setFont('helvetica', cell.bold ? 'bold' : 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor(cell.color[0], cell.color[1], cell.color[2])
          pdf.text(cell.text, x, y + 12)
          x += cols[j].w
        })

        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.3)
        pdf.line(M, y + 18, M + CW, y + 18)
        y += 18
      })

      // Summary stats box
      y += 12
      const critical = sorted.filter(d => d.score >= 80).length
      const high = sorted.filter(d => d.score >= 60 && d.score < 80).length
      pdf.setFillColor(239, 246, 255)
      pdf.roundedRect(M, y, CW, 52, 4, 4, 'F')
      pdf.setDrawColor(191, 219, 254)
      pdf.roundedRect(M, y, CW, 52, 4, 4, 'S')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.setTextColor(26, 82, 118)
      pdf.text('National Summary', M + 12, y + 15)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(71, 85, 105)
      pdf.text(`Critical priority districts: ${critical}   ·   High priority districts: ${high}   ·   Total districts: ${sorted.length}`, M + 12, y + 29)
      pdf.text('Need score based on MoE student-to-school ratio (primary level). Score ≥ 80 = Critical.', M + 12, y + 42)

      drawFooter(pdf, W, H, M)
      pdf.save(`edumap-national-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('National report failed:', err)
      alert('Failed to generate national report.')
    } finally {
      setExporting(null)
    }
  }

  // ── District Report ───────────────────────────────────────────
  const exportDistrict = () => {
    if (!selectedDistrictId) return
    setExporting('district')
    try {
      const d = districts.find(di => String(di.id) === String(selectedDistrictId))
      if (!d) return

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const W = 595.28, H = 841.89, M = 40, CW = W - M * 2

      drawHeader(pdf, W, M, `${d.name} District`, 'Multi-Level Infrastructure Gap Report')

      let y = 96
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(15, 23, 42)
      pdf.text('Infrastructure Gap Analysis', M, y)
      y += 22

      const levels = [
        { key: 'primary',   pop: Number(d.p_age_pop)||0, schools: Number(d.p_schools)||0,   label: 'Primary' },
        { key: 'secondary', pop: Number(d.s_age_pop)||0, schools: Number(d.s_schools)||0,   label: 'Secondary' },
        { key: 'tertiary',  pop: Number(d.t_age_pop)||0, schools: Number(d.t_institutions)||0, label: 'Tertiary' },
      ]

      levels.forEach(lv => {
        const score = calcScore(lv.pop, lv.schools, lv.key)
        const need  = getNeedLevel(score)
        const needColor = need.label === 'Critical' ? [220,38,38]
          : need.label === 'High' ? [234,88,12]
          : need.label === 'Medium' ? [202,138,4]
          : [22,163,74]

        // Level card
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(M, y, CW, 62, 4, 4, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.5)
        pdf.roundedRect(M, y, CW, 62, 4, 4, 'S')

        // Left colour accent
        pdf.setFillColor(...needColor)
        pdf.roundedRect(M, y, 5, 62, 2, 2, 'F')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor(15, 23, 42)
        pdf.text(`${lv.label} Level`, M + 16, y + 18)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(71, 85, 105)
        pdf.text(`Age-group population: ${lv.pop.toLocaleString()}`, M + 16, y + 31)
        pdf.text(`Existing ${lv.key === 'tertiary' ? 'institutions' : 'schools'}: ${lv.schools}`, M + 16, y + 43)
        pdf.text(`Need score: ${score.toFixed(1)}`, M + 16, y + 55)

        // Priority badge on right
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(13)
        pdf.setTextColor(...needColor)
        pdf.text(need.label, W - M - 12, y + 28, { align: 'right' })
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(100, 116, 139)
        pdf.text('Priority Level', W - M - 12, y + 41, { align: 'right' })

        y += 74
      })

      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184)
      pdf.text('For recommended site coordinates, run spatial analysis on the Map page and use "Tools & Export → Export PDF".', M, y)

      drawFooter(pdf, W, H, M)
      pdf.save(`edumap-${d.name.toLowerCase().replace(/\s+/g,'-')}-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('District report failed:', err)
      alert('Failed to generate district report.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Generate MIS Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Export infrastructure gap reports for the Ministry of Education.</p>
      </div>

      {/* National Report Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-blue-50 text-[#1a5276] rounded-2xl flex items-center justify-center text-2xl shrink-0">🇲🇼</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">National Infrastructure Report</h2>
            <p className="text-sm text-slate-500 mt-1">All 28 districts ranked by primary school need score. Includes school counts, need scores, and priority classifications.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['All 28 Districts', 'Need Score Rankings', 'Priority Classification', 'MoE Criteria'].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-blue-50 text-[#1a5276] text-[10px] font-bold rounded-full uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={exportNational}
          disabled={loading || exporting === 'national'}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#1a5276] text-white font-bold rounded-xl shadow-lg hover:bg-[#154360] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting === 'national' ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
          ) : (
            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>Export National Report (PDF)</>
          )}
        </button>
      </div>

      {/* District Report Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl shrink-0">📊</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">District Infrastructure Report</h2>
            <p className="text-sm text-slate-500 mt-1">Single-district breakdown across all three levels: primary, secondary, and tertiary. Includes population data and gap analysis.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Primary · Secondary · Tertiary', 'Population Data', 'Gap Analysis'].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select District</label>
          <select
            value={selectedDistrictId}
            onChange={e => setSelectedDistrictId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1a5276]/20 focus:border-[#1a5276] outline-none transition-all"
          >
            <option value="">Choose a district...</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <button
          onClick={exportDistrict}
          disabled={!selectedDistrictId || loading || exporting === 'district'}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exporting === 'district' ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
          ) : (
            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>Export District Report (PDF)</>
          )}
        </button>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
        <p className="text-sm text-blue-700 font-medium">
          For a report with recommended site coordinates and map image, run spatial analysis on the <strong>Map page</strong> then use <strong>Tools &amp; Export → Export PDF</strong>.
        </p>
      </div>
    </div>
  )
}
