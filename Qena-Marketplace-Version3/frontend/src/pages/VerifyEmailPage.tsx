import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)

  const { verifyEmail, resendOTP } = useAuth()

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyEmail(email, otp)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await resendOTP(email)
      setResendTimer(60)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 animate-fade-in-up">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-1 text-center">Verify Email</h1>
        <p className="text-slate-500 text-sm mb-6 text-center">
          Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{email}</span>
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">6-digit code</label>
            <input
              type="text"
              maxLength={6}
              pattern="\d{6}"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="input-field text-center text-xl tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3.5 !text-base mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Verify & Continue →'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resendTimer > 0}
            className={`text-sm font-medium transition ${
              resendTimer > 0 
                ? 'text-slate-400 cursor-not-allowed' 
                : 'text-orange-500 hover:underline'
            }`}
          >
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Wrong email?{' '}
          <Link to="/register" className="text-orange-500 font-medium hover:underline">Register again</Link>
          {' '}or{' '}
          <Link to="/login" className="text-orange-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}