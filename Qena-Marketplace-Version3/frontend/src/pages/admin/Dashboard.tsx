import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/financial/sellers'),
    ]).then(([s, sel]) => {
      setStats(s.data)
      setSellers(sel.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  )

  const f = stats?.financial || {}

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-black mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of Qena Marketplace</p>

      {/* General Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '👥', label: 'Total Users', value: stats?.total_users || 0, color: 'blue' },
          { icon: '🏪', label: 'Total Sellers', value: stats?.total_sellers || 0, color: 'orange' },
          { icon: '📦', label: 'Total Orders', value: stats?.total_orders || 0, color: 'purple' },
          { icon: '⏳', label: 'Pending Sellers', value: stats?.pending_sellers || 0, color: 'yellow' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className="text-3xl font-black text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Financial Overview */}
      <h2 className="text-xl font-black mb-4">💰 Financial Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-5 md:col-span-1">
          <p className="text-orange-100 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-black">{f.total_revenue?.toLocaleString() || 0}</p>
          <p className="text-orange-200 text-sm">EGP — all orders</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5">
          <p className="text-green-100 text-sm mb-1">Platform Balance</p>
          <p className="text-3xl font-black">{f.platform_balance?.toLocaleString() || 0}</p>
          <p className="text-green-200 text-sm">EGP — after payouts</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5">
          <p className="text-blue-100 text-sm mb-1">Sellers Wallets</p>
          <p className="text-3xl font-black">{f.total_wallet_balance?.toLocaleString() || 0}</p>
          <p className="text-blue-200 text-sm">EGP — pending payout</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-gray-500 text-sm mb-1">💸 Total Paid to Sellers</p>
          <p className="text-2xl font-black text-slate-800">{f.paid_withdrawals?.toLocaleString() || 0} EGP</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-gray-500 text-sm mb-1">⏳ Pending Withdrawals</p>
          <p className="text-2xl font-black text-slate-800">{f.pending_withdrawals?.toLocaleString() || 0} EGP</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-gray-500 text-sm mb-1">📈 Total Earned by Sellers</p>
          <p className="text-2xl font-black text-slate-800">{f.total_earned_by_sellers?.toLocaleString() || 0} EGP</p>
        </div>
      </div>

      {/* Sellers Financial Table */}
      <h2 className="text-xl font-black mb-4">🏪 Sellers Financial Details</h2>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Seller</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Orders</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Total Earned</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Balance</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Withdrawn</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sellers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No sellers yet</td></tr>
            ) : sellers.map(s => (
              <tr key={s.seller_id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center font-bold text-orange-600 text-sm">
                      {s.shop_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{s.shop_name}</p>
                      <p className="text-xs text-gray-400">{s.seller_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium">{s.orders_count}</td>
                <td className="px-6 py-4 text-right font-bold text-green-600">{s.total_earned.toLocaleString()} EGP</td>
                <td className="px-6 py-4 text-right font-bold text-orange-600">{s.balance.toLocaleString()} EGP</td>
                <td className="px-6 py-4 text-right text-gray-600">{s.total_withdrawn.toLocaleString()} EGP</td>
                <td className="px-6 py-4 text-right">
                  {s.pending_withdrawal > 0
                    ? <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">{s.pending_withdrawal.toLocaleString()} EGP</span>
                    : <span className="text-gray-400">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
          {sellers.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-bold">
              <tr>
                <td className="px-6 py-3 text-gray-700">Total</td>
                <td className="px-6 py-3 text-right">{sellers.reduce((a, s) => a + s.orders_count, 0)}</td>
                <td className="px-6 py-3 text-right text-green-600">{sellers.reduce((a, s) => a + s.total_earned, 0).toLocaleString()} EGP</td>
                <td className="px-6 py-3 text-right text-orange-600">{sellers.reduce((a, s) => a + s.balance, 0).toLocaleString()} EGP</td>
                <td className="px-6 py-3 text-right">{sellers.reduce((a, s) => a + s.total_withdrawn, 0).toLocaleString()} EGP</td>
                <td className="px-6 py-3 text-right text-yellow-600">{sellers.reduce((a, s) => a + s.pending_withdrawal, 0).toLocaleString()} EGP</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-black mb-4">⚡ Quick Actions</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/sellers" className="bg-green-600 text-white p-5 rounded-2xl hover:bg-green-700 transition">
          <div className="text-3xl mb-2">✓</div>
          <h3 className="font-bold">Approve Sellers</h3>
          <p className="text-sm opacity-80">{stats?.pending_sellers || 0} pending</p>
        </Link>
        <Link to="/admin/payments" className="bg-orange-600 text-white p-5 rounded-2xl hover:bg-orange-700 transition">
          <div className="text-3xl mb-2">💸</div>
          <h3 className="font-bold">Manage Payments</h3>
          <p className="text-sm opacity-80">Withdrawals & wallets</p>
        </Link>
        <Link to="/admin/orders" className="bg-purple-600 text-white p-5 rounded-2xl hover:bg-purple-700 transition">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-bold">All Orders</h3>
          <p className="text-sm opacity-80">{stats?.total_orders || 0} total orders</p>
        </Link>
      </div>
    </div>
  )
}
