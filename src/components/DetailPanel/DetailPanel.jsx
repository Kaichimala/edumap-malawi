export default function DetailPanel({ district, level, onClose }) {
  return (
    <div className="w-80 bg-white h-full overflow-y-auto p-4 border-l shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">{district.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black text-xl">✕</button>
      </div>
      <p className="text-sm text-gray-600">Detail panel — coming soon</p>
    </div>
  )
}