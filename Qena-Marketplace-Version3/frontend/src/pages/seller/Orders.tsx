import React, { useEffect, useState } from 'react'
import api from '../../api/client'

interface Order {
  id: number
  buyer_name: string
  total_amount: number
  status: string
  created_at: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sellers/me/orders')
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch {}
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Orders Received</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500">No orders yet. Share your shop!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold text-lg">Order #{o.id}</p>
                  <p className="text-gray-500 text-sm">👤 {o.buyer_name}</p>
                  <p className="text-gray-400 text-sm">
                    🕐 {new Date(o.created_at).toLocaleDateString('en-EG', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-orange-600">{o.total_amount.toLocaleString()} EGP</p>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {o.status === 'pending' && (
                    <button onClick={() => updateStatus(o.id, 'confirmed')}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                      ✓ Confirm
                    </button>
                  )}
                  {o.status === 'confirmed' && (
                    <button onClick={() => updateStatus(o.id, 'shipped')}
                      className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700">
                      🚚 Mark Shipped
                    </button>
                  )}
                  {o.status === 'shipped' && (
                    <button onClick={() => updateStatus(o.id, 'delivered')}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">
                      ✅ Mark Delivered
                    </button>
                  )}
                  {o.status === 'pending' && (
                    <button onClick={() => updateStatus(o.id, 'cancelled')}
                      className="bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-sm hover:bg-red-200">
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SellerOrders
