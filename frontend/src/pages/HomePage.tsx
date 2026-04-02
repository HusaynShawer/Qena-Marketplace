import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/products?limit=8`)
      .then(res => res.json())
      .then(data => {
        setFeaturedProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to Qena Marketplace</h1>
          <p className="text-xl mb-8">Your local online marketplace for Qena and surrounding areas</p>
          <Link to="/products" className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Electronics', 'Clothing', 'Home & Garden', 'Books'].map(cat => (
            <Link key={cat} to={`/products?category=${cat}`} className="bg-gray-100 p-6 rounded-lg text-center hover:bg-gray-200 transition">
              <div className="text-4xl mb-2">
                {cat === 'Electronics' && '📱'}
                {cat === 'Clothing' && '👕'}
                {cat === 'Home & Garden' && '🏠'}
                {cat === 'Books' && '📚'}
              </div>
              <div className="font-semibold">{cat}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12 bg-gray-50">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage