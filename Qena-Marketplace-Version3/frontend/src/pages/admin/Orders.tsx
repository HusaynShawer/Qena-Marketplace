import React from 'react'

const AdminOrders: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">All Orders</h1>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No orders yet.</p>
      </div>
    </div>
  )
}

export default AdminOrders