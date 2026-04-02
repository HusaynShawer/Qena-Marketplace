import React from 'react'

const OrdersPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <p className="text-gray-600">You haven't placed any orders yet.</p>
      </div>
    </div>
  )
}

export default OrdersPage