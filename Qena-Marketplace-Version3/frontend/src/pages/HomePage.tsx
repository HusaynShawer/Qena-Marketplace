import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const categories = [
  { name: 'Electronics',       icon: '📱', color: 'from-blue-500 to-blue-600' },
  { name: 'Clothing & Fashion', icon: '👗', color: 'from-pink-500 to-rose-500' },
  { name: 'Home & Garden',     icon: '🏡', color: 'from-green-500 to-emerald-500' },
  { name: 'Books & Education', icon: '📚', color: 'from-purple-500 to-violet-500' },
  { name: 'Sports & Hobbies',  icon: '⚽', color: 'from-orange-500 to-orange-600' },
  { name: 'Food & Groceries',  icon: '🍎', color: 'from-red-500 to-red-600' },
  { name: 'Cars & Vehicles',   icon: '🚗', color: 'from-yellow-500 to-amber-500' },
  { name: 'Other',             icon: '🛍️', color: 'from-fuchsia-500 to-pink-500' },
]

const features = [
  { icon: '🚚', title: 'Free Shipping',     desc: 'On all orders over $50' },
  { icon: '🔒', title: 'Secure Checkout',   desc: '256-bit SSL encryption' },
  { icon: '🔄', title: '30-Day Returns',    desc: 'No questions asked' },
  { icon: '💬', title: '24/7 Support',      desc: 'We\'re always here' },
]

export default function HomePage() {
  const [products, setProducts]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [visible, setVisible]     = useState(false)
  const navigate                   = useNavigate()

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    fetch(`${API}/products?limit=8`)
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="page-enter">
      {/* ─── HERO ─── */}
      <section className="hero-gradient relative overflow-hidden min-h-[88vh] flex items-center">
        {/* Decorative Blobs */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-[-150px] left-[-80px]  w-[450px] h-[450px] rounded-full bg-orange-400/8  blur-3xl" />

        {/* Floating emojis */}
        <div className="absolute top-20 right-[15%] text-5xl animate-float  opacity-70">📱</div>
        <div className="absolute top-40 right-[8%]  text-4xl animate-float2 opacity-60 delay-200">👗</div>
        <div className="absolute bottom-32 right-[18%] text-5xl animate-float opacity-70 delay-400">🏡</div>
        <div className="absolute bottom-20 right-[6%]  text-4xl animate-float2 opacity-60 delay-300">📚</div>
        <div className="absolute top-28 right-[28%] text-3xl animate-float opacity-50 delay-500">⚽</div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-20">
          <div className="max-w-2xl">
            {/* Pill badge */}
            <div className={`inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-orange-300 mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              🎉 New vendors joining every day!
            </div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Shop<br />
              <span className="gradient-text">Everything</span><br />
              Local
            </h1>

            <p className={`text-slate-300 text-xl leading-relaxed mb-10 max-w-lg transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Discover amazing products from hundreds of local vendors in Qena. Great prices, fast delivery, real people.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className={`mb-8 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-1.5 max-w-lg border border-white/20">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products, brands..."
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-400 focus:outline-none text-sm"
                />
                <button type="submit" className="btn-primary !py-3 !px-6 !text-sm flex-shrink-0">
                  Search 🔍
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className={`flex flex-wrap gap-3 mb-12 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Link to="/products" className="btn-primary !py-3.5 !px-8">
                Shop Now →
              </Link>
              <Link to="/register?role=seller" className="btn-white !py-3.5 !px-8">
                🏪 Start Selling
              </Link>
            </div>

            {/* Stats */}
            <div className={`flex flex-wrap gap-8 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {[
                { n: '500+', l: 'Products' },
                { n: '100+', l: 'Vendors' },
                { n: '5K+',  l: 'Happy Customers' },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div className="text-3xl font-black gradient-text">{n}</div>
                  <div className="text-slate-400 text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="bg-white py-10 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map(({ icon, title, desc }, i) => (
            <div key={title} className={`flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-50 transition-colors animate-fade-in-up delay-${i*100}`}>
              <div className="text-3xl flex-shrink-0">{icon}</div>
              <div>
                <div className="font-bold text-slate-800 text-sm">{title}</div>
                <div className="text-slate-500 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-800 mb-2">Shop by Category</h2>
          <p className="text-slate-500">Explore our wide range of product categories</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map(({ name, icon, color, q }, i) => (
            <Link
              key={name}
              to={`/products?category=${encodeURIComponent(name)}`}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} text-white hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-${Math.min(i, 5) * 100}`}
            >
              <span className="text-3xl">{icon}</span>
              <span className="text-xs font-bold text-center leading-tight">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-1">Featured Products</h2>
              <p className="text-slate-500">Hand-picked deals from our best vendors</p>
            </div>
            <Link to="/products" className="btn-secondary !py-2 !px-5 !text-sm hidden sm:flex">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton h-52" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 rounded-lg" />
                    <div className="skeleton h-3 rounded-lg w-2/3" />
                    <div className="skeleton h-8 rounded-lg mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-slate-500 text-lg">No products yet — be the first to list!</p>
              <Link to="/register?role=seller" className="btn-primary mt-6 inline-flex">Start Selling</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p, i) => (
                <div key={p.id} className={`animate-fade-in-up delay-${Math.min(i, 7) * 100}`}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link to="/products" className="btn-primary">View All Products →</Link>
          </div>
        </div>
      </section>

      {/* ─── BECOME A SELLER ─── */}
      <section className="py-20 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl animate-float">🏪</div>
          <div className="absolute bottom-10 right-10 text-7xl animate-float2">💰</div>
          <div className="absolute top-1/2 left-1/3 text-6xl animate-float">📦</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to <span className="gradient-text">Start Selling?</span>
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Open your shop in minutes. No monthly fees. Reach thousands of customers across Qena instantly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register?role=seller" className="btn-primary !py-4 !px-10 !text-base animate-pulse-ring">
              🏪 Open My Shop Free
            </Link>
            <Link to="/products" className="btn-white !py-4 !px-10 !text-base">
              Browse Products
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto">
            {[
              { icon: '⚡', title: '2 min setup', sub: 'Quick onboarding' },
              { icon: '💸', title: 'Zero fees',   sub: 'Start for free' },
              { icon: '📈', title: 'Grow fast',   sub: 'Built-in audience' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-white font-bold text-sm">{title}</div>
                <div className="text-slate-400 text-xs">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}