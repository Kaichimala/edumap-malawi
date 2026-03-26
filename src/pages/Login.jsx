import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { TbMapRoute }         from 'react-icons/tb'
import { MdErrorOutline }     from 'react-icons/md'
import { LuEye, LuEyeOff }   from 'react-icons/lu'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState(null)
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setTimeout(() => {
      const { error } = signIn(email, password)
      setLoading(false)
      if (error) setError(error.message)
      else navigate('/')
    }, 600)
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

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-900 to-brand-700 px-8 pt-10 pb-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-5 border border-white/20">
              <TbMapRoute className="w-9 h-9 text-sky-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">EduMap Malawi</h1>
            <p className="text-brand-200 text-sm mt-1">Educational Planning &amp; Decision Support</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-brand-900 mb-1">Sign In</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your credentials to access the dashboard.</p>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <MdErrorOutline className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@edumap.mw"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800
                      placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
                  >
                    {showPassword
                      ? <LuEyeOff className="w-4 h-4" />
                      : <LuEye    className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-lg
                  text-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" /> Signing in…</>
                  : 'Sign In'
                }
              </button>
            </form>
          </div>

          {/* Demo hint */}
          <div className="px-8 py-3 bg-brand-50 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Demo: <span className="font-medium text-slate-500">admin@edumap.mw</span>
              {' · '}
              <span className="font-medium text-slate-500">edumap2025</span>
            </p>
          </div>

          {/* Footer */}
          <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Ministry of Education, Malawi · Secure Access Only</p>
          </div>
        </div>
      </div>
    </div>
  )
}