import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { HiOutlineLockClosed, HiOutlineMail } from 'react-icons/hi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f7] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1a5276] rounded-2xl shadow-xl mb-6 text-white text-3xl font-black italic">
            EM
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">EduMap Malawi</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Ministry of Education</p>
          <div className="w-12 h-1 bg-[#1a5276] mx-auto mt-4 rounded-full opacity-20" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          <div className="px-10 py-12">
            <h2 className="text-xl font-bold text-slate-800 mb-8">System Access</h2>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm font-medium animate-shake">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a5276] transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@education.gov.mw"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#1a5276] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Access Token / Password</label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a5276] transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#1a5276] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#1a5276] hover:bg-[#154360] text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Authorize Access
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Management Information System</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Active</span>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-10 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          Department of Education Planning &amp; Research · Government of Malawi
        </p>
      </div>
    </div>
  )
}