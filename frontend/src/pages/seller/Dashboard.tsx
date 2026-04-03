import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SellerDashboard() {
  const { user, token } = useAuth()
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [shopName, setShopName]   = useState('')
  const [shopDesc, setShopDesc]   = useState('')
  const [applying, setApplying]   = useState(false)
  const [msg, setMsg]             = useState('')

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API}/sellers/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)
    try {
      const res = await fetch(`${API}/sellers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shop_name: shopName, shop_description: shopDesc }),
      })
      const d = await res.json()
      if (res.ok) setMsg('✅ Application submitted! Awaiting admin approval.')
      else setMsg(`❌ ${d.detail}`)
    } catch { setMsg('❌ Network error') }
    setApplying(false)
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div><div className="text-6xl mb-4 animate-float">🔐</div>
      <h1 className="text-xl font-bold text-slate-800 mb-3">Login required</h1>
      <Link to="/login" className="btn-primary">Sign In</Link></div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Not a seller yet or not approved
  if (!stats) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center page-enter">
      <div className="text-6xl mb-4 animate-float">🏪</div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">Open Your Shop</h1>
      <p className="text-slate-500 mb-8">Register as a seller to start listing your products on QenaMarket.</p>
      {msg && <div className="mb-4 p-3 rounded-xl bg-orange-50 text-orange-700 text-sm">{msg}</div>}
      <div className="card p-8 text-left">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Shop Name *</label>
            <input value={shopName} onChange={e => setShopName(e.target.value)}
              placeholder="e.g. Ahmed's Electronics" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Shop Description</label>
            <textarea value={shopDesc} onChange={e => setShopDesc(e.target.value)}
              placeholder="Tell customers about your shop..." rows={3}
              className="input-field !h-auto resize-none" />
          </div>
          <button type="submit" disabled={applying} className="btn-primary w-full !py-3.5">
            {applying ? 'Submitting...' : '🚀 Apply to Sell'}
          </button>
        </form>
      </div>
    </div>
  )

  if (!stats.approved) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center page-enter">
      <div className="text-6xl mb-4 animate-float2">⏳</div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">Application Pending</h1>
      <p className="text-slate-500">Your shop <strong>{stats.shop_name}</strong> is awaiting admin approval. We'll notify you soon!</p>
    </div>
  )

  const statCards = [
    { icon: '💰', label: 'Revenue', value: `$${stats.stats?.revenue?.toFixed(2) || '0.00'}`, color: 'from-green-500 to-emerald-500' },
    { icon: '📦', label: 'Products', value: stats.stats?.products ?? 0, color: 'from-blue-500 to-blue-600' },
    { icon: '🛒', label: 'Orders', value: stats.stats?.orders ?? 0, color: 'from-orange-500 to-orange-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Seller Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user.name}! Here's your shop overview.</p>
        </div>
        <span className="badge badge-green !text-sm !px-4 !py-2">✅ Active Seller</span>
      </div>

      {/* Shop info */}
      <div className="card p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center text-2xl shadow-md">🏪</div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">{stats.shop_name}</h2>
          <p className="text-slate-500 text-sm">{stats.shop_description || 'No description set'}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ icon, label, value, color }) => (
          <div key={label} className={`card p-6 bg-gradient-to-br ${color} text-white border-0`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-3xl font-black">{value}</div>
            <div className="text-white/80 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/seller/products" className="card p-6 flex items-center gap-4 hover:border-orange-200 hover:bg-orange-50 transition-colors group">
          <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center text-2xl transition-colors">📦</div>
          <div>
            <h3 className="font-bold text-slate-800">Manage Products</h3>
            <p className="text-sm text-slate-500">Add, edit or remove products</p>
          </div>
          <span className="ml-auto text-slate-300 group-hover:text-orange-400 transition-colors text-xl">→</span>
        </Link>
        <Link to="/seller/orders" className="card p-6 flex items-center gap-4 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
          <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center text-2xl transition-colors">📋</div>
          <div>
            <h3 className="font-bold text-slate-800">View Orders</h3>
            <p className="text-sm text-slate-500">Manage incoming orders</p>
          </div>
          <span className="ml-auto text-slate-300 group-hover:text-blue-400 transition-colors text-xl">→</span>
        </Link>
      </div>
    </div>
  )
}