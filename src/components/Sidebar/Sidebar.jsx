export default function Sidebar({ districts, level, onSelect, selectedDistrict }) {
  return (
    <div className="w-72 bg-gray-100 h-full overflow-y-auto p-3 border-r">
      <h2 className="font-bold text-lg mb-3">Districts</h2>
      {districts.map(d => (
        <div
          key={d.id}
          onClick={() => onSelect(d)}
          className={`p-3 mb-2 rounded cursor-pointer border ${
            selectedDistrict?.id === d.id ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'
          }`}
        >
          {d.name}
        </div>
      ))}
    </div>
  )
}