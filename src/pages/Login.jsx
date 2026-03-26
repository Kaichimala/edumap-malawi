import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { TbMapRoute }                from 'react-icons/tb'
import { MdErrorOutline }            from 'react-icons/md'
import { LuEye, LuEyeOff }          from 'react-icons/lu'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

// ─── Mock user accounts (replace with Supabase when ready) ───────────────────
const MOCK_USERS = [
  { email: 'admin@edumap.mw',   password: 'edumap2025', name: 'Admin User',     role: 'admin'  },
  { email: 'officer@moe.mw',    password: 'officer123', name: 'Planning Officer', role: 'officer' },
  { email: 'analyst@edumap.mw', password: 'analyst123', name: 'Data Analyst',    role: 'analyst' },
]

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [tab, setTab]               = useState('signin')   // 'signin' | 'signup'
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [name, setName]             = useState('')
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [showPass, setShowPass]     = useState(false)

  function reset() { setError(null); setSuccess(null) }

  /* ─── Sign In ────────────────────────────────────────────────────────────── */
  function handleSignIn(e) {
    e.preventDefault()
    reset()
    setLoading(true)

    setTimeout(() => {
      const { error } = signIn(email, password)
      setLoading(false)
      if (error) setError(error.message)
      else navigate('/')
    }, 600)
  }

  /* ─── Sign Up (mock — just validates and shows success) ──────────────────── */
  function handleSignUp(e) {
    e.preventDefault()
    reset()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    const exists = MOCK_USERS.some(u => u.email === email.trim().toLowerCase())
    if (exists) { setError('An account with this email already exists.'); return }
    // In real version: call supabase.auth.signUp()
    setSuccess('Account registered! In demo mode, use an existing demo account to sign in.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-sky-500 flex items-center justify-center p-4">

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-32 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-brand-400/10 rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl shadow-brand-900/30 overflow-hidden">

          {/* ── Card Header ── */}
          <div className="bg-gradient-to-r from-brand-900 to-brand-700 px-8 pt-10 pb-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-5 border border-white/20">
              <TbMapRoute className="w-9 h-9 text-sky-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">EduMap Malawi</h1>
            <p className="text-brand-200 text-sm mt-1">Educational Planning &amp; Decision Support</p>
          </div>

          {/* ── Tab Toggle ── */}
          <div className="px-8 pt-6">
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {[['signin', 'Sign In'], ['signup', 'Register']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); reset() }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    tab === key
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-brand-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Form Body ── */}
          <div className="px-8 py-6">

            {/* Error / Success banners */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <MdErrorOutline className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* ── Sign In Form ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">Email Address</label>
                  <input
                    id="email" type="email" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@edumap.mw"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                      placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">Password</label>
                  <div className="relative">
                    <input
                      id="password" type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                        placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors">
                      {showPass ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-lg
                    text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
                  {loading ? <><AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── Register Form ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="reg-name">Full Name</label>
                  <input
                    id="reg-name" type="text" required
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="John Banda"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                      placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="reg-email">Email Address</label>
                  <input
                    id="reg-email" type="email" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="officer@education.mw"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                      placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="reg-password">
                    Password <span className="font-normal text-slate-400">(min. 6 chars)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password" type={showPass ? 'text' : 'password'} required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                        placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors">
                      {showPass ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg
                    text-sm transition-colors flex items-center justify-center gap-2 mt-1">
                  Create Account
                </button>
              </form>
            )}
          </div>

          {/* ── Demo hint ── */}
          <div className="px-8 py-3 bg-brand-50 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Demo accounts: &nbsp;
              <span className="font-medium text-slate-500">admin@edumap.mw</span> · <span className="font-medium text-slate-500">edumap2025</span>
            </p>
          </div>
          <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Ministry of Education, Malawi · Secure Access Only</p>
          </div>

        </div>
      </div>
    </div>
  )
}
