import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 })
  const [shop, setShop] = useState({ shop_name: '', approved: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sellers/me')
      .then(res => {
        setStats(res.data.stats)
        setShop({ shop_name: res.data.shop_name, approved: res.data.approved })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Loading...</p></div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{shop.shop_name || 'My Shop'}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${shop.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {shop.approved ? '✅ Approved' : '⏳ Pending Approval'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold text-gray-600">Total Products</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.products}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">🛍️</div>
          <h3 className="font-semibold text-gray-600">Total Orders</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.orders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold text-gray-600">Total Revenue</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.revenue.toLocaleString()} EGP</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/seller/products"
          className="bg-orange-600 text-white p-6 rounded-lg text-center hover:bg-orange-700 transition">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold text-lg">My Products</h3>
          <p className="text-sm opacity-90">Manage your listings</p>
        </Link>
        <Link to="/seller/orders"
          className="bg-blue-600 text-white p-6 rounded-lg text-center hover:bg-blue-700 transition">
          <div className="text-3xl mb-2">🛍️</div>
          <h3 className="font-semibold text-lg">Orders Received</h3>
          <p className="text-sm opacity-90">{stats.orders} orders to manage</p>
        </Link>
      </div>
    </div>
  )
}

export default SellerDashboard
