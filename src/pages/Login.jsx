import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const navigate    = useNavigate()
  const [tab, setTab]           = useState('signin')   // 'signin' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')          // signup only
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)

  const reset = () => { setError(null); setSuccess(null) }

  /* ─── Sign In ─────────────────────────────────────────── */
  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true); reset()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/')
  }

  /* ─── Sign Up ─────────────────────────────────────────── */
  async function handleSignUp(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }
    setLoading(true); reset()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess('Account created! Check your email to confirm before signing in.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/40">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">EduMap Malawi</h1>
          <p className="text-gray-400 text-sm mt-1">Education Infrastructure Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">

          {/* Tab Toggle */}
          <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
            {[['signin', 'Sign In'], ['signup', 'Register']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); reset() }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${tab === key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── SIGN IN FORM ── */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@education.mw"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5
                             placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5
                             placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition"
                />
              </div>

              {error   && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                id="signin-submit"
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed
                           text-white font-semibold py-2.5 rounded-lg transition-all duration-200
                           shadow-md shadow-blue-600/30 hover:shadow-blue-500/40 mt-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── SIGN UP FORM ── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Banda"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5
                             placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@education.mw"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5
                             placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Password <span className="normal-case font-normal text-gray-500">(min. 6 characters)</span>
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5
                             placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition"
                />
              </div>

              {error   && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                id="signup-submit"
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed
                           text-white font-semibold py-2.5 rounded-lg transition-all duration-200
                           shadow-md shadow-blue-600/30 hover:shadow-blue-500/40 mt-2"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Ministry of Education, Science &amp; Technology · Malawi
        </p>
      </div>
    </div>
  )
}