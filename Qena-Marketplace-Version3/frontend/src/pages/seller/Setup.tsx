import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

const SellerSetup: React.FC = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [approved, setApproved] = useState(false)

  const [form, setForm] = useState({
    shop_name: '',
    shop_description: '',
    phone: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const checkSeller = async () => {
      try {
        const res = await api.get('/sellers/me')

        setAlreadyApplied(true)
        setApproved(res.data.approved)
      } catch (err: any) {
        if (err.response?.status !== 404) {
          setError(
            err.response?.data?.detail || 'Failed to load seller status.'
          )
        }
      } finally {
        setChecking(false)
      }
    }

    checkSeller()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!form.shop_name.trim()) {
      setError('Shop name is required.')
      return
    }

    if (!form.phone.trim()) {
      setError('Phone is required.')
      return
    }

    setLoading(true)

    try {
      await api.post('/sellers/apply', form)

      const res = await api.get('/sellers/me')

      setAlreadyApplied(true)
      setApproved(res.data.approved)

      setSuccess(
        'Application submitted! An admin will review it shortly.'
      )
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking status...
      </div>
    )
  }

  if (alreadyApplied && approved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-5xl">✅</div>

        <h2 className="text-2xl font-bold text-gray-900">
          Your shop is approved!
        </h2>

        <p className="text-gray-500">
          You can manage your products and orders from the seller dashboard.
        </p>

        <button
          onClick={() => navigate('/seller')}
          className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition"
        >
          Go to Seller Dashboard
        </button>
      </div>
    )
  }

  if (alreadyApplied && !approved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-5xl">⏳</div>

        <h2 className="text-2xl font-bold text-gray-900">
          Application Under Review
        </h2>

        <p className="text-gray-500 max-w-sm">
          Your seller application has been submitted. An admin will review your
          account shortly.
        </p>

        <button
          onClick={() => navigate('/')}
          className="text-orange-600 underline text-sm hover:text-orange-700"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏪</div>

          <h1 className="text-2xl font-bold text-gray-900">
            Open Your Shop
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Fill in your shop details. After submitting, an admin will approve
            your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name *
              </label>

              <input
                name="shop_name"
                value={form.shop_name}
                onChange={handleChange}
                required
                placeholder="e.g. Ahmed's Electronics"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Description
              </label>

              <textarea
                name="shop_description"
                value={form.shop_description}
                onChange={handleChange}
                rows={4}
                placeholder="Tell customers what you sell..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="01012345678"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white rounded-lg py-3 font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting...' : '🚀 Submit Application'}
            </button>

          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <a
            href="/seller"
            className="text-orange-600 hover:underline"
          >
            Go to dashboard
          </a>
        </p>

      </div>
    </div>
  )
}

export default SellerSetup