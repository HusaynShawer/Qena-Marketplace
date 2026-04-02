import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface ProductCardProps {
  product: {
    id: number
    name: string
    description?: string
    price: number
    image_url?: string
    stock: number
  }
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart()

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link to={`/products/${product.id}`}>
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-orange-600 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description || 'No description available'}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-orange-600">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product.id)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-300 text-sm"
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard