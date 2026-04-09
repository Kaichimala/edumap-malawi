import { useState } from 'react'
import { HiOutlineCog, HiOutlineShieldCheck, HiOutlineDatabase, HiOutlineCloudUpload, HiOutlineLockClosed } from 'react-icons/hi'

export default function SettingsPage() {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage EduMap Malawi MIS configuration and user permissions.</p>
        </div>
        
        {isSaved && (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-bold border border-green-100 animate-bounce">
            ✅ Settings saved successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Data Settings */}
        <div className="space-y-6">
          <SettingsCard 
            icon={<HiOutlineDatabase className="w-6 h-6 text-[#1a5276]" />}
            title="MIS Data Synchronization"
            description="Configure synchronization intervals and manual overrides for the spatial database."
            status="Last sync: 12m ago"
          />
          
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
              📡
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a5276] uppercase tracking-widest">Connection Status</p>
              <p className="text-sm font-black text-slate-800">Supabase Cloud: VERIFIED</p>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <HiOutlineLockClosed className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-800">Password & Security</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                placeholder="••••••••"
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                placeholder="••••••••"
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                placeholder="••••••••"
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 italic">Password must be at least 8 characters and include a special character.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">System Engine Status: Optimal</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-[#1a5276] text-white font-black rounded-xl shadow-xl hover:bg-[#154360] hover:scale-105 active:scale-95 transition-all"
        >
          Save All Changes
        </button>
      </div>
    </div>
  )
}

function SettingsCard({ icon, title, description, status }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center transition-colors group-hover:bg-white group-hover:ring-4 group-hover:ring-slate-100">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">{title}</h3>
            {status && <span className="text-[10px] font-black text-[#1a5276] bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">{status}</span>}
          </div>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}
