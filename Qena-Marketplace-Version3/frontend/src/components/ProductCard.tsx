import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image_url?: string
    category?: string
    reviews?: Array<{ rating: number }>
    review_count?: number
    avg_rating?: number
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  // احسب المتوسط والعدد من الـ reviews لو موجودة
  const reviews = product.reviews || []
  const reviewCount = product.review_count ?? reviews.length
  const avgRating = product.avg_rating ?? (
    reviews.length > 0 
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length 
      : 0
  )
  
  const fullStars = Math.round(avgRating)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product.id, 1)
  }

  return (
    <Link to={`/products/${product.id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-50">📦</div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2 group-hover:text-orange-600 transition">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-yellow-400 text-xs tracking-tight">
            {'★'.repeat(Math.round(product.avg_rating || 0))}{'☆'.repeat(5 - Math.round(product.avg_rating || 0))}
          </span>
          <span className="text-xs text-gray-400">
            ({product.review_count || 0})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-orange-600 font-bold text-lg">
            {product.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">EGP</span>
          </span>
          <button 
            onClick={handleAdd}
            className="bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-orange-700 active:scale-95 transition flex items-center gap-1"
          >
            🛒 Add
          </button>
        </div>
      </div>
    </Link>
  )
}