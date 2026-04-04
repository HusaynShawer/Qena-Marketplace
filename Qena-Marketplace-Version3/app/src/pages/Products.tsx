import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/solid'
import { useCart } from '../context/CartContext'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  stock: number
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (product.stock === 0) return
    setAdding(true)
    await addToCart(product.id)
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <div className="card group overflow-hidden flex flex-col">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
        <div className="h-52 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <span className="text-6xl group-hover:scale-110 transition-transform duration-300">📦</span>
          )}
        </div>

        {/* Stock badge */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="badge badge-gray !text-sm !px-4 !py-2 font-bold uppercase tracking-widest">Out of Stock</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-red animate-pulse">Only {product.stock} left</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-slate-800 line-clamp-2 hover:text-orange-500 transition-colors mb-1 text-sm leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Stars placeholder */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`h-3 w-3 ${i < 4 ? 'text-amber-400' : 'text-slate-200'}`} />
          ))}
          <span className="text-xs text-slate-400 ml-1">(12)</span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-xl font-black text-orange-500">${product.price.toFixed(2)}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock === 0 || adding}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              product.stock === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : adding
                ? 'bg-green-500 text-white scale-95'
                : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md active:scale-95'
            }`}
          >
            {adding ? (
              <><span className="text-base">✓</span> Added!</>
            ) : (
              <><ShoppingCartIcon className="h-4 w-4" /> Add</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}