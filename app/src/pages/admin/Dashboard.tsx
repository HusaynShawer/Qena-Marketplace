import { Link } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-semibold">Total Users</h3>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">🏪</div>
          <h3 className="font-semibold">Total Sellers</h3>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold">Total Revenue</h3>
          <p className="text-2xl font-bold text-orange-600">$0</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/admin/sellers" className="bg-green-600 text-white p-6 rounded-lg text-center hover:bg-green-700">
          <div className="text-3xl mb-2">✓</div>
          <h3 className="font-semibold">Approve Sellers</h3>
          <p className="text-sm opacity-90">Review and approve seller applications</p>
        </Link>
        <Link to="/admin/orders" className="bg-purple-600 text-white p-6 rounded-lg text-center hover:bg-purple-700">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold">All Orders</h3>
          <p className="text-sm opacity-90">View all platform orders</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard