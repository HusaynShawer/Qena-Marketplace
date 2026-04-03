import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const { login }                  = useAuth()
  const navigate                   = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel – Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 hero-gradient p-12 text-white relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-500/10 animate-spin-slow" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-orange-400/10 animate-spin-slow" style={{animationDirection:'reverse'}} />

        <Link to="/" className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">Q</span>
          </div>
          <span className="text-2xl font-black">QenaMarket</span>
        </Link>

        <div className="z-10 animate-fade-in-up">
          <h2 className="text-4xl font-black leading-tight mb-4">
            Welcome back to<br />
            <span className="gradient-text">Qena's best</span><br />
            marketplace
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Thousands of products from local vendors. Shop smarter, shop local.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { number: '500+', label: 'Products' },
              { number: '100+', label: 'Vendors' },
              { number: '5K+',  label: 'Customers' },
              { number: '4.8★', label: 'Avg Rating' },
            ].map(({ number, label }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl font-black gradient-text">{number}</div>
                <div className="text-slate-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-sm z-10">© 2024 QenaMarket</p>
      </div>

      {/* Right Panel – Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 orange-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-black text-slate-800">QenaMarket</span>
          </Link>

          <div className="card p-8">
            <h1 className="text-2xl font-black text-slate-800 mb-1">Sign in</h1>
            <p className="text-slate-500 text-sm mb-7">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange-500 font-semibold hover:underline">Create one free</Link>
            </p>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <a href="#" className="text-xs text-orange-500 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3.5 !text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3">or continue as</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/register?role=buyer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-medium text-slate-700">
                🛍️ Buyer
              </Link>
              <Link to="/register?role=seller"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-medium text-slate-700">
                🏪 Seller
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}