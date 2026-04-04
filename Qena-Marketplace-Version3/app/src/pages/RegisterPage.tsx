import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const [searchParams]              = useSearchParams()
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [role, setRole]             = useState(searchParams.get('role') || 'buyer')
  const [showPass, setShowPass]     = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const { register }                 = useAuth()
  const navigate                     = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      await register(name, email, password, role)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 hero-gradient p-12 text-white relative overflow-hidden">
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
            Join the<br />
            <span className="gradient-text">fastest growing</span><br />
            marketplace in Qena
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Whether you're buying or selling, QenaMarket connects you with the best local vendors.
          </p>

          <div className="space-y-4">
            {[
              { icon: '🛍️', title: 'As a Buyer',  desc: 'Access hundreds of products from local vendors at great prices.' },
              { icon: '🏪', title: 'As a Seller', desc: 'Open your own shop and reach thousands of customers in Qena.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-4 flex gap-4 items-start">
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="font-bold text-white">{title}</div>
                  <div className="text-slate-400 text-sm">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-sm z-10">© 2024 QenaMarket</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 orange-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-black text-slate-800">QenaMarket</span>
          </Link>

          <div className="card p-8">
            <h1 className="text-2xl font-black text-slate-800 mb-1">Create account</h1>
            <p className="text-slate-500 text-sm mb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link>
            </p>

            {/* Role Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6 p-1 bg-slate-50">
              {[
                { value: 'buyer',  label: '🛍️ I want to Buy' },
                { value: 'seller', label: '🏪 I want to Sell' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    role === value
                      ? 'bg-white text-orange-500 shadow-sm border border-orange-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="input-field pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length > i * 2 + 2
                          ? password.length >= 8 ? 'bg-green-400' : 'bg-orange-400'
                          : 'bg-slate-200'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3.5 !text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : `Create ${role === 'seller' ? 'Seller' : 'Buyer'} Account →`}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-5">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-orange-500 hover:underline">Terms</a> &amp;{' '}
              <a href="#" className="text-orange-500 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}