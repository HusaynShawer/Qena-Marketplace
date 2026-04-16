import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../api/client'

type PaymentMethod = 'cod' | 'card' | 'vodafone'

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [step, setStep] = useState<'checkout' | 'payment' | 'success'>('checkout')
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [vfPhone, setVfPhone] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', address: '', city: '', phone: '' })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const formatCard = (val: string) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = (val: string) => val.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/')

  const handlePlaceOrder = async () => {
    setError('')
    if (!form.firstName || !form.lastName || !form.address || !form.city || !form.phone) {
      setError('Please fill in all shipping information')
      return
    }
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }
    if (paymentMethod !== 'cod') {
      setStep('payment')
      return
    }
    await submitOrder('cod')
  }

  const handlePayNow = async () => {
    setError('')
    if (paymentMethod === 'card') {
      if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
        setError('Please fill in all card details')
        return
      }
    }
    if (paymentMethod === 'vodafone') {
      if (!vfPhone || vfPhone.length < 11) {
        setError('Please enter a valid Vodafone Cash number')
        return
      }
    }
    await submitOrder(paymentMethod)
  }

  const submitOrder = async (method: string) => {
    setLoading(true)
    setError('')
    try {
      // Simulate payment processing for non-COD
      if (method !== 'cod') {
        await new Promise(r => setTimeout(r, 2000))
      }

      // ✅ FIX: send the actual shipping form fields the backend expects
      await api.post('/orders/', {
        buyer_phone: form.phone,
        buyer_address: form.address,
        buyer_city: form.city,
        buyer_notes: '',
      })

      await clearCart()
      setStep('success')
    } catch (e: any) {
      // ✅ FIX: handle both string and array detail responses
      const detail = e?.response?.data?.detail
      if (Array.isArray(detail)) {
        // FastAPI validation errors — show the first one clearly
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else {
        setError(detail || 'Failed to place order. Please try again.')
      }
    }
    setLoading(false)
  }

  // ── Success Screen ──
  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">✅</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-3">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Your order has been successfully placed.</p>
        {paymentMethod !== 'cod' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700">
            💰 Payment of <strong>{cartTotal.toLocaleString()} EGP</strong> confirmed!
            <br />Funds transferred to marketplace wallet.
          </div>
        )}
        {paymentMethod === 'cod' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-700">
            💵 Please prepare <strong>{cartTotal.toLocaleString()} EGP</strong> cash for delivery.
          </div>
        )}
        <div className="text-xs text-gray-400 mb-6">
          Order ref: #QNA-{Date.now().toString().slice(-6)}
        </div>
        <button onClick={() => navigate('/orders')}
          className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition mb-3">
          View My Orders →
        </button>
        <button onClick={() => navigate('/')}
          className="w-full border border-gray-200 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition">
          Continue Shopping
        </button>
      </div>
    </div>
  )

  // ── Payment Screen ──
  if (step === 'payment') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <button onClick={() => setStep('checkout')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-2 text-sm">
          ← Back
        </button>

        <div className="text-center mb-8">
          <div className="text-4xl mb-2">{paymentMethod === 'card' ? '💳' : '📱'}</div>
          <h2 className="text-2xl font-black">
            {paymentMethod === 'card' ? 'Card Payment' : 'Vodafone Cash'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Simulation Mode 🔧</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Amount */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Amount to pay</p>
          <p className="text-3xl font-black text-orange-600">{cartTotal.toLocaleString()} EGP</p>
        </div>

        {/* Card Form */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Card Number</label>
              <input
                value={cardForm.number}
                onChange={e => setCardForm({ ...cardForm, number: formatCard(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                className="w-full border-2 rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:border-orange-400 tracking-widest"
                maxLength={19}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cardholder Name</label>
              <input
                value={cardForm.name}
                onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                placeholder="Ahmed Mohamed"
                className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Expiry</label>
                <input
                  value={cardForm.expiry}
                  onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  className="w-full border-2 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-orange-400"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">CVV</label>
                <input
                  value={cardForm.cvv}
                  onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  placeholder="123"
                  type="password"
                  className="w-full border-2 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-orange-400"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-600">
              🔧 <strong>Simulation:</strong> Use any card number. No real charge will be made.
            </div>
          </div>
        )}

        {/* Vodafone Cash Form */}
        {paymentMethod === 'vodafone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Vodafone Cash Number</label>
              <input
                value={vfPhone}
                onChange={e => setVfPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="010XXXXXXXX"
                className="w-full border-2 rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:border-orange-400 tracking-widest"
                maxLength={11}
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
              <p className="font-bold mb-1">📱 How it works:</p>
              <p>1. Enter your Vodafone Cash number</p>
              <p>2. You'll receive an OTP on your phone</p>
              <p>3. Confirm the payment</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-600">
              🔧 <strong>Simulation:</strong> Enter any 11-digit number. No real charge.
            </div>
          </div>
        )}

        <button
          onClick={handlePayNow}
          disabled={loading}
          className="w-full mt-6 bg-orange-600 text-white py-4 rounded-xl font-black text-lg hover:bg-orange-700 transition disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Processing Payment...
            </span>
          ) : `Pay ${cartTotal.toLocaleString()} EGP →`}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          🔒 256-bit SSL encryption · Simulation Mode
        </p>
      </div>
    </div>
  )

  // ── Main Checkout ──
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-black text-slate-800 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">💳 Payment Method</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cod', icon: '💵', label: 'Cash on Delivery', sub: 'Pay when you receive' },
                  { id: 'card', icon: '💳', label: 'Credit/Debit Card', sub: 'Visa, Mastercard' },
                  { id: 'vodafone', icon: '📱', label: 'Vodafone Cash', sub: 'Mobile wallet' },
                ].map(m => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-4 rounded-xl border-2 text-left transition ${paymentMethod === m.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <div className="font-bold text-xs">{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
                    {paymentMethod === m.id && (
                      <div className="mt-1 text-xs text-orange-600 font-bold">✓ Selected</div>
                    )}
                  </button>
                ))}
              </div>
              {paymentMethod !== 'cod' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-600">
                  🔧 <strong>Simulation Mode:</strong> No real money will be charged. For testing only.
                </div>
              )}
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📦 Shipping Information</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'firstName', placeholder: 'First Name *' },
                  { name: 'lastName', placeholder: 'Last Name *' },
                ].map(f => (
                  <input key={f.name} name={f.name} value={form[f.name as keyof typeof form]}
                    onChange={handleChange} placeholder={f.placeholder}
                    className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                ))}
                <input name="address" value={form.address} onChange={handleChange}
                  placeholder="Address *"
                  className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm col-span-2" />
                <input name="city" value={form.city} onChange={handleChange}
                  placeholder="City *"
                  className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="Phone *"
                  className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">🛍️ Your Items</h2>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.product?.image_url
                        ? <img src={item.product.image_url} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-orange-600 text-sm">
                      {((item.product?.price || 0) * item.quantity).toLocaleString()} EGP
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="font-black text-xl mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>{cartTotal.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free 🚚</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment</span>
                  <span className="font-medium text-xs">
                    {paymentMethod === 'cod' ? '💵 Cash on Delivery' :
                      paymentMethod === 'card' ? '💳 Card' : '📱 Vodafone Cash'}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-black text-2xl text-orange-600">
                    {cartTotal.toLocaleString()} EGP
                  </span>
                </div>
              </div>
              <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-lg hover:bg-orange-700 transition disabled:opacity-50 active:scale-95">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Placing Order...
                    </span>
                  : paymentMethod === 'cod' ? '📦 Place Order (COD)' : '💳 Continue to Payment →'
                }
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                🔒 Your information is secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}