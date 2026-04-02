import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SellerDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Seller Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold">Total Sales</h3>
          <p className="text-2xl font-bold text-orange-600">$0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold">Products</h3>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">🛒</div>
          <h3 className="font-semibold">Orders</h3>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/seller/products" className="bg-orange-600 text-white p-6 rounded-lg text-center hover:bg-orange-700">
          <div className="text-3xl mb-2">➕</div>
          <h3 className="font-semibold">Manage Products</h3>
          <p className="text-sm opacity-90">Add, edit, or remove products</p>
        </Link>
        <Link to="/seller/orders" className="bg-blue-600 text-white p-6 rounded-lg text-center hover:bg-blue-700">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-semibold">View Orders</h3>
          <p className="text-sm opacity-90">Manage incoming orders</p>
        </Link>
      </div>
    </div>
  )
}

export default SellerDashboard