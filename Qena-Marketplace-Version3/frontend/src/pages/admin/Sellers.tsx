import React, { useEffect, useState } from 'react'
import api from '../../api/client'

interface Seller {
  id: number
  shop_name: string
  shop_description: string
  user: { id: number; name: string; email: string }
}

const AdminSellers: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<number | null>(null)

  const fetchSellers = () => {
    api.get('/admin/sellers/pending')
      .then(res => setSellers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSellers() }, [])

  const approveSeller = async (id: number) => {
    setApproving(id)
    try {
      await api.put(`/admin/sellers/${id}/approve`)
      setSellers(prev => prev.filter(s => s.id !== id))
    } catch {}
    setApproving(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Pending Seller Approvals</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sellers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">✅ No pending seller applications.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sellers.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{s.shop_name}</h3>
                <p className="text-gray-500 text-sm">{s.shop_description}</p>
                <p className="text-gray-400 text-sm mt-1">👤 {s.user?.name} · {s.user?.email}</p>
              </div>
              <button
                onClick={() => approveSeller(s.id)}
                disabled={approving === s.id}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {approving === s.id ? 'Approving...' : '✓ Approve'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminSellers
