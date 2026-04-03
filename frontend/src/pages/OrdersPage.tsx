import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const statusColors: Record<string, string> = {
  pending:   'badge-orange',
  confirmed: 'badge-blue',
  shipped:   'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}

export default function OrdersPage() {
  const { user, token } = useAuth()
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4 animate-float">🔐</div>
        <h1 className="text-xl font-bold text-slate-800 mb-3">Login to view your orders</h1>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <h1 className="text-2xl font-black text-slate-800 mb-8">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 rounded-lg mb-3 w-1/3" />
              <div className="skeleton h-4 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 animate-float">📋</div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-6">When you place an order, it will appear here.</p>
          <Link to="/products" className="btn-primary">Start Shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-6 animate-fade-in-up">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">ORDER #{String(order.id).padStart(5,'0')}</div>
                  <div className="text-sm text-slate-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US',{dateStyle:'medium'}) : 'N/A'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusColors[order.status] || 'badge-gray'} !text-xs !px-3 !py-1`}>
                    {order.status?.toUpperCase() || 'PENDING'}
                  </span>
                  <span className="text-orange-500 font-bold">${order.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700">{item.product_name} × {item.quantity}</span>
                      <span className="text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}