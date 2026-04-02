import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CartPage: React.FC = () => {
  const { cart, cartTotal } = useCart()

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link to="/products" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-4 border-b py-4">
              <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                📦
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{item.product?.name}</h3>
                <p className="text-orange-600 font-bold">${item.product?.price}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <Link to="/checkout" className="block w-full bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CartPage