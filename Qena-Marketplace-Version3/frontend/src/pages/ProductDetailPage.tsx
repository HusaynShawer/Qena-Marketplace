import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('details')
  const [adding, setAdding] = useState(false)
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/reviews`),
    ]).then(([p, r]) => {
      setProduct(p.data)
      setReviews(r.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    setAdding(true)
    await addToCart(Number(id), quantity)
    setAdding(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  )

  if (!product) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
      <Link to="/products" className="text-orange-600 hover:underline">Back to Products</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-orange-600">Products</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>

        {/* Main */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 gap-0">

            {/* Image */}
            <div className="bg-gray-50 flex items-center justify-center min-h-80 p-8">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name}
                  className="max-h-96 w-full object-contain rounded-xl" />
              ) : (
                <span className="text-9xl opacity-30">📦</span>
              )}
            </div>

            {/* Info */}
            <div className="p-8">
              {product.category && (
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  {product.category}
                </span>
              )}
              <h1 className="text-3xl font-black text-slate-800 mt-3 mb-2">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400 text-lg">{'★'.repeat(4)}{'☆'.repeat(1)}</div>
                <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
              </div>

              {/* Price */}
              <div className="text-4xl font-black text-orange-600 mb-4">
                {product.price.toLocaleString()} <span className="text-xl font-normal text-gray-500">EGP</span>
              </div>

              {/* Stock */}
              <div className="mb-6">
                {product.stock > 5 ? (
                  <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                    ✅ In Stock ({product.stock} available)
                  </span>
                ) : product.stock > 0 ? (
                  <span className="bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1 rounded-full">
                    ⚠️ Only {product.stock} left!
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
                    ❌ Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity */}
              {product.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity:</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border-2 border-gray-200 rounded-xl hover:border-orange-400 font-bold text-lg transition">−</button>
                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 border-2 border-gray-200 rounded-xl hover:border-orange-400 font-bold text-lg transition">+</button>
                    <span className="text-sm text-gray-400">max {product.stock}</span>
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <button onClick={handleAddToCart} disabled={product.stock === 0 || adding}
                className={`w-full py-4 rounded-xl font-bold text-lg transition mb-3 ${
                  product.stock > 0
                    ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                {adding ? '⏳ Adding...' : product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
              </button>

              <Link to="/cart"
                className="block w-full py-3 rounded-xl border-2 border-orange-600 text-orange-600 font-bold text-center hover:bg-orange-50 transition">
                View Cart →
              </Link>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t flex gap-4 text-xs text-gray-500 flex-wrap">
                <span>✅ Free Shipping</span>
                <span>🔒 Secure Checkout</span>
                <span>🔄 30-Day Returns</span>
              </div>

              {/* Vendor */}
              {product.seller && (
                <Link to={`/vendor/${product.seller.id}`}
                  className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition group">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-bold text-orange-600">
                    {product.seller.shop_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sold by</p>
                    <p className="font-semibold text-sm group-hover:text-orange-600 transition">
                      {product.seller.shop_name} →
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            {['details', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 font-semibold text-sm transition capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tab === 'reviews' ? `Reviews (${reviews.length})` : 'Product Details'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'details' && (
              <div>
                <h3 className="font-bold text-lg mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description || 'No description available.'}</p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{product.category || 'Uncategorized'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700">Stock:</span>
                    <span className="ml-2 text-gray-600">{product.stock} units</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700">Listed:</span>
                    <span className="ml-2 text-gray-600">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">⭐</div>
                    <p className="text-gray-500">No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="border-b pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-sm">
                            {r.user_name[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm">{r.user_name}</span>
                          <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        </div>
                        <p className="text-gray-600 text-sm ml-10">{r.comment}</p>
                        <p className="text-xs text-gray-400 ml-10 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
