import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CheckoutPage = () => {
  const { cartTotal } = useCart()
  const navigate = useNavigate()

  const handlePlaceOrder = async () => {
    // TODO: Implement order creation
    alert('Order placed successfully!')
    navigate('/orders')
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="First Name" className="input-field" />
              <input type="text" placeholder="Last Name" className="input-field" />
              <input type="text" placeholder="Address" className="input-field md:col-span-2" />
              <input type="text" placeholder="City" className="input-field" />
              <input type="text" placeholder="Phone" className="input-field" />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handlePlaceOrder} className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
            Place Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage