import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CartPage() {
  const { cart, cartTotal, removeFromCart, updateQuantity } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 page-enter">
        <div className="text-6xl mb-4 animate-float">🔐</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Please login to view your cart</h1>
        <p className="text-slate-500 mb-6">You need to be signed in to add items to your cart.</p>
        <Link to="/login" className="btn-primary">Sign In →</Link>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 page-enter">
        <div className="text-8xl mb-6 animate-float">🛒</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary">Start Shopping →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <h1 className="text-2xl font-black text-slate-800 mb-8">
        Shopping Cart <span className="text-slate-400 font-normal text-lg">({cart.length} items)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="card p-5 flex gap-5 items-center">
              {/* Image */}
              <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product_id}`}>
                  <h3 className="font-semibold text-slate-800 hover:text-orange-500 transition-colors truncate">
                    {item.product?.name || 'Product'}
                  </h3>
                </Link>
                <p className="text-orange-500 font-bold text-lg mt-1">
                  ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                </p>
                <p className="text-slate-400 text-xs">${(item.product?.price || 0).toFixed(2)} each</p>
              </div>

              {/* Qty Controls */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow transition-all text-slate-600"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-slate-800 text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow transition-all text-slate-600"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-medium text-green-600">{cartTotal >= 50 ? 'FREE' : '$5.00'}</span>
              </div>
              {cartTotal < 50 && (
                <div className="text-xs text-slate-400 bg-orange-50 rounded-lg px-3 py-2">
                  Add ${(50 - cartTotal).toFixed(2)} more for free shipping 🚚
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mb-5">
              <div className="flex justify-between font-bold text-slate-800 text-lg">
                <span>Total</span>
                <span className="text-orange-500">${(cartTotal + (cartTotal < 50 ? 5 : 0)).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full !py-4 !text-base"
            >
              Proceed to Checkout →
            </button>

            <Link
              to="/products"
              className="block text-center text-sm text-slate-500 hover:text-orange-500 transition-colors mt-4"
            >
              ← Continue Shopping
            </Link>

            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span>🔒 Secure Checkout</span>
              <span>•</span>
              <span>🛡️ Buyer Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}