import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (cart.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🛒</div>
      <h1 className="text-3xl font-black text-slate-800 mb-3">Your Cart is Empty</h1>
      <p className="text-gray-500 mb-8">Add some products and come back!</p>
      <Link to="/products" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition">
        Browse Products →
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-black text-slate-800 mb-8">
          🛒 Your Cart <span className="text-lg font-normal text-gray-400">({cart.length} items)</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-5 flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product?.image_url
                    ? <img src={item.product.image_url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{item.product?.name}</h3>
                  <p className="text-orange-600 font-bold text-lg">{item.product?.price.toLocaleString()} EGP</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 border-2 rounded-lg font-bold hover:border-orange-400 transition">−</button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product?.stock || 0)}
                      className="w-8 h-8 border-2 rounded-lg font-bold hover:border-orange-400 transition disabled:opacity-40">+</button>
                    <button onClick={() => removeFromCart(item.id)}
                      className="ml-auto text-red-400 hover:text-red-600 text-sm transition">🗑️ Remove</button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-slate-800">
                    {((item.product?.price || 0) * item.quantity).toLocaleString()} EGP
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="font-black text-xl mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span className="truncate flex-1 mr-2">{item.product?.name} ×{item.quantity}</span>
                    <span className="font-medium">{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-black text-2xl text-orange-600">{cartTotal.toLocaleString()} EGP</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">+ Free Shipping 🚚</p>
              </div>
              <button
                onClick={() => user ? navigate('/checkout') : navigate('/login')}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-lg hover:bg-orange-700 transition active:scale-95">
                {user ? '💳 Proceed to Checkout' : '🔑 Login to Checkout'}
              </button>
              <Link to="/products"
                className="block text-center mt-3 text-sm text-gray-500 hover:text-orange-600 transition">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
