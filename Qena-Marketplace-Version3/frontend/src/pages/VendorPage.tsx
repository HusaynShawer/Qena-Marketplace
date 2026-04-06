import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import ProductCard from '../components/ProductCard'

export default function VendorPage() {
  const { id } = useParams<{ id: string }>()
  const [seller, setSeller] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/sellers/${id}`),
      api.get(`/sellers/${id}/products`),
    ]).then(([s, p]) => {
      setSeller(s.data)
      setProducts(p.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  )

  if (!seller) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🏪</div>
      <h1 className="text-2xl font-bold mb-4">Vendor Not Found</h1>
      <Link to="/products" className="text-orange-600 hover:underline">Browse Products</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-black">
              {seller.shop_name?.[0]?.toUpperCase() || '🏪'}
            </div>
            <div>
              <h1 className="text-3xl font-black mb-1">{seller.shop_name}</h1>
              <p className="text-orange-100 mb-3">{seller.shop_description || 'Welcome to our store!'}</p>
              <div className="flex gap-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">📦 {products.length} Products</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">✅ Verified Seller</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">All Products from {seller.shop_name}</h2>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">No products yet from this vendor</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
