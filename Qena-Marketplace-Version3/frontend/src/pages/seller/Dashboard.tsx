import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/client'

const SellerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 })
  const [shop, setShop] = useState({ shop_name: '', approved: false })
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)

  useEffect(() => {
    api.get('/sellers/me')
      .then(res => {
        setStats(res.data.stats || { products: 0, orders: 0, revenue: 0 })
        setShop({ shop_name: res.data.shop_name, approved: res.data.approved })
      })
      .catch((err) => {
        // 404 means they never applied — redirect to setup
        if (err.response?.status === 404) {
          setNoProfile(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"/>
    </div>
  )

  // No seller profile at all — prompt them to set up their shop
  if (noProfile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🏪</div>
      <h2 className="text-2xl font-bold text-gray-900">You don't have a shop yet</h2>
      <p className="text-gray-500 max-w-sm">Set up your seller profile to start listing products.</p>
      <button
        onClick={() => navigate('/seller/setup')}
        className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition">
        Create My Shop
      </button>
    </div>
  )

  // Applied but not approved yet
  if (!shop.approved) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">⏳</div>
      <h2 className="text-2xl font-bold text-gray-900">
        {shop.shop_name || 'Your shop'} is pending approval
      </h2>
      <p className="text-gray-500 max-w-sm">
        An admin needs to approve your account before you can list products or manage orders.
        Check back soon!
      </p>
      <a href="/" className="text-orange-600 underline text-sm hover:text-orange-700">Back to Home</a>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{shop.shop_name || 'My Shop'}</h1>
          <span className="text-sm px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
            ✅ Approved
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
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/seller/products/new"
          className="bg-orange-600 text-white p-6 rounded-lg text-center hover:bg-orange-700 transition">
          <div className="text-3xl mb-2">➕</div>
          <h3 className="font-semibold text-lg">Add Product</h3>
          <p className="text-sm opacity-90">List a new item</p>
        </Link>
        <Link to="/seller/products"
          className="bg-white border border-gray-200 text-gray-800 p-6 rounded-lg text-center hover:bg-gray-50 transition">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold text-lg">My Products</h3>
          <p className="text-sm text-gray-500">Manage your listings</p>
        </Link>
        <Link to="/seller/orders"
          className="bg-blue-600 text-white p-6 rounded-lg text-center hover:bg-blue-700 transition">
          <div className="text-3xl mb-2">🛍️</div>
          <h3 className="font-semibold text-lg">Orders</h3>
          <p className="text-sm opacity-90">{stats.orders} orders to manage</p>
        </Link>
      </div>
    </div>
  )
}

export default SellerDashboard