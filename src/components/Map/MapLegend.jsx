const LEGEND_ITEMS = {
  need: [
    { label: 'Critical (≥80)', color: '#dc2626' },
    { label: 'High (60–79)',   color: '#ea580c' },
    { label: 'Medium (40–59)', color: '#ca8a04' },
    { label: 'Low (<40)',      color: '#16a34a' },
  ],
  population: [
    { label: '> 250k',       color: '#1e3a8a' },
    { label: '150k – 250k',  color: '#3b82f6' },
    { label: '80k – 150k',   color: '#93c5fd' },
    { label: '< 80k',        color: '#dbeafe' },
  ],
  institutions: [
    { label: '> 100',  color: '#581c87' },
    { label: '51–100', color: '#9333ea' },
    { label: '26–50',  color: '#d8b4fe' },
    { label: '≤ 25',   color: '#f3e8ff' },
  ],
  suitability: [
    { label: 'High priority (≥80)', color: '#dc2626' },
    { label: 'Feasible (60–79)',    color: '#ea580c' },
    { label: 'Moderate (40–59)',    color: '#ca8a04' },
    { label: 'Low (<40)',           color: '#16a34a' },
  ],
}

const MODE_LABELS = {
  need: 'Need Score',
  population: 'Population',
  institutions: 'Institutions',
  suitability: 'Suitability',
}

export default function MapLegend({ mode }) {
  const items = LEGEND_ITEMS[mode] || LEGEND_ITEMS.need

  return (
    <div className="absolute bottom-6 right-4 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg shadow-brand-900/10 p-4 min-w-[180px]">
      {/* Mode title */}
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-brand-700 mb-3">
        {MODE_LABELS[mode]}
      </h4>

      {/* District color scale */}
      <div className="space-y-1.5 mb-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-2.5" />

      {/* Marker types */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm shrink-0" />
          <span className="text-xs text-slate-500">School</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-sm shrink-0" />
          <span className="text-xs text-slate-500">Recommended Site</span>
        </div>
      </div>
    </div>
  )
}
