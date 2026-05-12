import { useState } from 'react'
import { HiOutlineCloudUpload, HiOutlineDatabase, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineTrash } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'

export default function DataManagementPage() {
  const navigate = useNavigate()
  const { datasets, refreshDatasets } = useData()
  const [file, setFile] = useState(null)
  const [tableName, setTableName] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLocalMode, setIsLocalMode] = useState(false)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!tableName) {
      setError('Please provide a target table name')
      return
    }
    if (!isLocalMode && !file) {
      setError('Please select a file to upload')
      return
    }
    if (isLocalMode && !localPath) {
      setError('Please provide a local folder path')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    const formData = new FormData()
    if (!isLocalMode) {
      formData.append('file', file)
    } else {
      formData.append('local_path', localPath)
    }
    formData.append('table_name', tableName)
    formData.append('replace', 'true')

    try {
      // Assuming the backend runs on port 8000
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        setResult(data)
        // Refresh the global datasets list so it shows up in the dropdowns
        if (refreshDatasets) refreshDatasets()
      } else {
        setError(data.detail || 'Upload failed')
      }
    } catch (err) {
      setError('Could not connect to the processing server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tableName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the dataset '${tableName}'? This cannot be undone.`)) return

    try {
      const response = await fetch(`http://localhost:8000/delete/${tableName}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        if (refreshDatasets) refreshDatasets()
      } else {
        const data = await response.json()
        setError(data.detail || 'Delete failed')
      }
    } catch (err) {
      setError('Could not connect to the processing server to delete.')
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Data Management</h1>
        <p className="text-sm text-slate-500 mt-1">Upload and process new geospatial datasets for the EduMap MIS.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center gap-4 text-[#1a5276] border-b border-slate-100 pb-6">
          <HiOutlineDatabase className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg">Import New Dataset</h3>
            <p className="text-sm text-slate-400">Upload CSV, GeoJSON, or Zip — or point to a local folder</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Target Table Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="e.g., mwi_new_schools"
                value={tableName}
                onChange={e => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  {isLocalMode ? 'Local Folder Path' : 'Dataset File'}
                </label>
                <button 
                  type="button"
                  onClick={() => setIsLocalMode(!isLocalMode)}
                  className="text-[10px] font-bold text-[#1a5276] hover:underline uppercase tracking-widest"
                >
                  {isLocalMode ? 'Switch to Upload' : 'Switch to Local Path'}
                </button>
              </div>

              {!isLocalMode ? (
                <div className="relative">
                  <input 
                    type="file" 
                    className="hidden" 
                    id="dataset-file"
                    onChange={e => setFile(e.target.files[0])}
                  />
                  <label 
                    htmlFor="dataset-file"
                    className="flex items-center justify-center w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-sm cursor-pointer hover:bg-slate-100 hover:border-[#1a5276] transition-all"
                  >
                    <HiOutlineCloudUpload className="w-5 h-5 mr-2 text-slate-400" />
                    <span className="truncate">{file ? file.name : 'Select file (CSV, GeoJSON, Zip)...'}</span>
                  </label>
                </div>
              ) : (
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="e.g., C:\GIS\Malawi_Schools_Extracted"
                  value={localPath}
                  onChange={e => setLocalPath(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
            <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Warning:</strong> Uploading will replace any existing table with the same name. Ensure your dataset includes spatial coordinates (lat/lng) or geometry.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
              loading ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-[#1a5276] hover:bg-[#154360] hover:scale-[1.01] active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                <HiOutlineCloudUpload className="w-6 h-6" />
                {isLocalMode ? 'Import from Local Folder' : 'Process and Upload to Supabase'}
              </>
            )}
          </button>
        </form>

        {loading && (
          <div className="space-y-4 py-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between text-xs font-black text-[#1a5276] uppercase tracking-widest px-1">
              <span className="animate-pulse">Analyzing Geospatial Schema...</span>
              <span>Please wait</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-[#1a5276] via-[#28b463] to-[#1a5276] bg-[length:200%_100%] animate-shimmer"
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-center text-[10px] text-slate-400 font-medium">
              Converting coordinates to WGS84 and optimizing spatial indices in Supabase
            </p>
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                <HiOutlineCheckCircle />
              </div>
              <div>
                <p className="font-black text-emerald-900 tracking-tight">Import Successful!</p>
                <p className="text-sm text-emerald-600 font-medium">
                  {result.count?.toLocaleString() || '0'} records synced to <span className="font-mono text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">{result.table}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-white text-emerald-700 text-xs font-black uppercase tracking-widest rounded-xl border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm active:scale-95"
            >
              View Dashboard
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
              <HiOutlineExclamationCircle />
            </div>
            <div className="pt-1">
              <p className="font-black text-rose-900 tracking-tight">Processing Failed</p>
              <p className="text-sm text-rose-600 font-medium leading-relaxed mt-0.5">{error}</p>
              <div className="mt-3 flex items-center gap-2">
                <button 
                  onClick={() => setError(null)}
                  className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                >
                  Dismiss Error
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Management Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1a5276]/10 rounded-lg flex items-center justify-center text-[#1a5276]">
            <HiOutlineDatabase />
          </div>
          <h2 className="font-black text-slate-800 tracking-tight">Active Datasets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets?.filter(ds => !['mwi_schools_with_districts', 'api_schools_for_app'].includes(ds.id)).map(ds => (
            <div key={ds.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#1a5276]/30 transition-all">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 leading-tight">{ds.name}</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">{ds.id}</span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-[10px] text-slate-400 font-medium">{ds.description}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(ds.id)}
                className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete Dataset"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
            </div>
          ))}

          {datasets?.filter(ds => !['mwi_schools_with_districts', 'api_schools_for_app'].includes(ds.id)).length === 0 && (
            <div className="col-span-full py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
              <HiOutlineDatabase className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">No custom datasets found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
