import React, { useEffect, useState } from 'react'
import api from '../../api/client'

interface SellerUser {
  id: number
  name: string
  email: string
}

interface Seller {
  id: number
  shop_name: string
  shop_description: string
  approved: boolean
  is_suspended: boolean
  suspension_reason: string | null
  suspended_at: string | null
  user: SellerUser | null
}

type Tab = 'pending' | 'active' | 'suspended'

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [showSuspendModal, setShowSuspendModal] = useState<Seller | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [busy, setBusy] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ id: number; text: string; ok: boolean } | null>(null)

  const fetchSellers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/sellers/all')
      setSellers(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchSellers() }, [])

  const flash = (id: number, text: string, ok = true) => {
    setMsg({ id, text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  const approveSeller = async (id: number) => {
    setBusy(id)
    try {
      await api.put(`/admin/sellers/${id}/approve`)
      setSellers(prev => prev.map(s => s.id === id ? { ...s, approved: true } : s))
      flash(id, 'Approved ✅')
    } catch (e: any) {
      flash(id, e?.response?.data?.detail || 'Failed', false)
    }
    setBusy(null)
  }

  const suspendSeller = async (seller: Seller) => {
    setBusy(seller.id)
    try {
      await api.put(`/admin/sellers/${seller.id}/suspend`, { reason: suspendReason || null })
      setSellers(prev => prev.map(s =>
        s.id === seller.id
          ? { ...s, is_suspended: true, suspension_reason: suspendReason || null }
          : s
      ))
      flash(seller.id, 'Suspended 🚫')
    } catch (e: any) {
      flash(seller.id, e?.response?.data?.detail || 'Failed', false)
    }
    setShowSuspendModal(null)
    setSuspendReason('')
    setBusy(null)
  }

  const unsuspendSeller = async (id: number) => {
    setBusy(id)
    try {
      await api.put(`/admin/sellers/${id}/unsuspend`)
      setSellers(prev => prev.map(s =>
        s.id === id
          ? { ...s, is_suspended: false, suspension_reason: null, suspended_at: null }
          : s
      ))
      flash(id, 'Re-activated ✅')
    } catch (e: any) {
      flash(id, e?.response?.data?.detail || 'Failed', false)
    }
    setBusy(null)
  }

  const pending   = sellers.filter(s => !s.approved && !s.is_suspended)
  const active    = sellers.filter(s => s.approved && !s.is_suspended)
  const suspended = sellers.filter(s => s.is_suspended)

  const tabData: Record<Tab, Seller[]> = { pending, active, suspended }
  const current = tabData[tab]

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Seller Management</h1>
      <p className="text-gray-500 text-sm mb-6">Approve, suspend, or re-activate seller accounts</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'pending',   label: 'Pending',   count: pending.length,   color: 'yellow' },
          { key: 'active',    label: 'Active',    count: active.length,    color: 'green'  },
          { key: 'suspended', label: 'Suspended', count: suspended.length, color: 'red'    },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
              tab === t.key
                ? 'bg-orange-600 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-400 text-center py-16">Loading...</div>
      ) : current.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">
            {tab === 'pending' ? '✅' : tab === 'active' ? '🏪' : '🚫'}
          </div>
          <p className="text-gray-400">
            {tab === 'pending'   ? 'No pending applications'
            : tab === 'active'  ? 'No active sellers yet'
            :                     'No suspended sellers'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {current.map(s => (
            <div key={s.id}
              className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${
                s.is_suspended ? 'border-red-400' : s.approved ? 'border-green-400' : 'border-yellow-400'
              }`}>

              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center
                    font-bold text-orange-600 text-lg shrink-0">
                    {s.shop_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{s.shop_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        s.is_suspended ? 'bg-red-100 text-red-600'
                        : s.approved   ? 'bg-green-100 text-green-700'
                        :                'bg-yellow-100 text-yellow-700'
                      }`}>
                        {s.is_suspended ? '🚫 Suspended' : s.approved ? '✅ Active' : '⏳ Pending'}
                      </span>
                    </div>
                    {s.shop_description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{s.shop_description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      👤 {s.user?.name} · {s.user?.email}
                    </p>
                    {s.is_suspended && s.suspension_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        Reason: {s.suspension_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {msg?.id === s.id && (
                    <span className={`text-xs font-medium ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {msg.text}
                    </span>
                  )}

                  {/* Pending → Approve */}
                  {!s.approved && !s.is_suspended && (
                    <button onClick={() => approveSeller(s.id)} disabled={busy === s.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold
                        hover:bg-green-700 disabled:opacity-50 transition">
                      {busy === s.id ? '...' : '✓ Approve'}
                    </button>
                  )}

                  {/* Active → Suspend */}
                  {s.approved && !s.is_suspended && (
                    <button onClick={() => setShowSuspendModal(s)} disabled={busy === s.id}
                      className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl
                        text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition">
                      🚫 Suspend
                    </button>
                  )}

                  {/* Suspended → Re-activate */}
                  {s.is_suspended && (
                    <button onClick={() => unsuspendSeller(s.id)} disabled={busy === s.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold
                        hover:bg-green-700 disabled:opacity-50 transition">
                      {busy === s.id ? '...' : '✅ Re-activate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSuspendModal(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1">Suspend Seller</h2>
            <p className="text-sm text-gray-500 mb-4">
              Suspending <strong>{showSuspendModal.shop_name}</strong> will immediately hide
              all their products from the storefront.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-gray-400">(optional — shown to seller)</span>
            </label>
            <textarea
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              rows={3}
              placeholder="e.g. Payment not received, policy violation..."
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
                focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => suspendSeller(showSuspendModal)}
                disabled={busy === showSuspendModal.id}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold
                  hover:bg-red-700 disabled:opacity-50 transition">
                {busy === showSuspendModal.id ? 'Suspending...' : '🚫 Confirm Suspend'}
              </button>
              <button onClick={() => { setShowSuspendModal(null); setSuspendReason('') }}
                className="px-5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}