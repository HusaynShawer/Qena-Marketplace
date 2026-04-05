import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../api/client'

const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', address: '', city: '', phone: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePlaceOrder = async () => {
    if (!form.firstName || !form.lastName || !form.address || !form.city || !form.phone) {
      alert('Please fill in all shipping information')
      return
    }
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }
    setLoading(true)
    try {
      await api.post('/orders/')
      await clearCart()
      alert('Order placed successfully! 🎉')
      navigate('/orders')
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to place order')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="firstName" value={form.firstName} onChange={handleChange}
                type="text" placeholder="First Name *"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input name="lastName" value={form.lastName} onChange={handleChange}
                type="text" placeholder="Last Name *"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input name="address" value={form.address} onChange={handleChange}
                type="text" placeholder="Address *"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 md:col-span-2" />
              <input name="city" value={form.city} onChange={handleChange}
                type="text" placeholder="City *"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input name="phone" value={form.phone} onChange={handleChange}
                type="text" placeholder="Phone *"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          {/* Cart Items Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Your Items</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-2 border-b">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product?.image_url
                        ? <img src={item.product.image_url} className="w-full h-full object-cover" />
                        : <span className="flex items-center justify-center h-full text-xl">📦</span>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-orange-600">
                      {((item.product?.price || 0) * item.quantity).toLocaleString()} EGP
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>{cartTotal.toLocaleString()} EGP</span>
          </div>
          <div className="flex justify-between mb-2 text-gray-500 text-sm">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-orange-600">{cartTotal.toLocaleString()} EGP</span>
            </div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading || cart.length === 0}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-50 transition">
            {loading ? 'Placing Order...' : '🛍️ Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
