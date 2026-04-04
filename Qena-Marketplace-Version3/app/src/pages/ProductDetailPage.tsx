import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  image_url: string
  seller_id: number
  category_id: number
  created_at: string
}

interface Review {
  id: number
  rating: number
  comment: string
  user_name: string
  created_at: string
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('details')
  const { addToCart } = useCart()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002'

  useEffect(() => {
    fetchProduct()
    fetchReviews()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${id}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddToCart = async () => {
    await addToCart(Number(id), quantity)
    alert('Added to cart!')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link to="/products" className="text-orange-600 hover:underline">
          Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-orange-600">Home</Link> / 
        <Link to="/products" className="hover:text-orange-600"> Products</Link> / 
        <span className="text-gray-700">{product.name}</span>
      </div>

      {/* Product Main Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <span className="text-8xl">📦</span>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex text-yellow-400">
              {'⭐'.repeat(4)} {'☆'.repeat(1)}
            </div>
            <span className="text-gray-500">({reviews.length} reviews)</span>
          </div>

          <div className="text-3xl font-bold text-orange-600 mb-4">
            ${product.price.toFixed(2)}
          </div>

          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Quantity:</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                -
              </button>
              <span className="text-xl font-semibold w-16 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-3 rounded-lg font-semibold transition duration-300 ${
              product.stock > 0
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? 'Add to Cart 🛒' : 'Out of Stock'}
          </button>

          <div className="mt-6 pt-6 border-t">
            <div className="flex gap-4 text-sm text-gray-600">
              <span>✅ Free Shipping</span>
              <span>🔒 Secure Checkout</span>
              <span>🔄 30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2 px-1 font-semibold transition ${
              activeTab === 'details'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 px-1 font-semibold transition ${
              activeTab === 'reviews'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-6">
        {activeTab === 'details' && (
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{product.description || 'No description available.'}</p>
            
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Product ID:</span> {product.id}
              </div>
              <div>
                <span className="font-semibold">Category:</span> {product.category_id || 'Uncategorized'}
              </div>
              <div>
                <span className="font-semibold">Listed on:</span> {new Date(product.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{review.user_name}</span>
                      <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage