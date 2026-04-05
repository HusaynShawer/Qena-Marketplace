import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import api from '../api/client'

const CATEGORIES = [
  { name: 'All', q: '' },
  { name: 'Electronics', q: 'Electronics' },
  { name: 'Clothing & Fashion', q: 'Clothing & Fashion' },
  { name: 'Home & Garden', q: 'Home & Garden' },
  { name: 'Books & Education', q: 'Books & Education' },
  { name: 'Sports & Hobbies', q: 'Sports & Hobbies' },
  { name: 'Food & Groceries', q: 'Food & Groceries' },
  { name: 'Cars & Vehicles', q: 'Cars & Vehicles' },
  { name: 'Other', q: 'Other' },
]

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    api.get('/products/?limit=200')
      .then(res => setAllProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Sync URL params when they change (e.g. clicking category from homepage)
  useEffect(() => {
    const cat = searchParams.get('category') || ''
    const s = searchParams.get('search') || ''
    setActiveCategory(cat)
    setSearch(s)
  }, [searchParams])

  useEffect(() => {
    let filtered = [...allProducts]
    if (activeCategory) {
      filtered = filtered.filter(p =>
        p.category && p.category.toLowerCase() === activeCategory.toLowerCase()
      )
    }
    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      )
    }
    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice))
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice))
    if (sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price)
    setProducts(filtered)
  }, [allProducts, activeCategory, search, minPrice, maxPrice, sortBy])

  const handleCategoryClick = (q: string) => {
    setSearchParams(q ? { category: q } : {})
  }

  const clearFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setSearchParams({})
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {activeCategory || 'All Products'}
        {!loading && <span className="text-lg font-normal text-gray-400 ml-3">({products.length} items)</span>}
      </h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c.name} onClick={() => handleCategoryClick(c.q)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === c.q
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-400 hover:text-orange-600'
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Search</h3>
              <input type="text" placeholder="Search products..." value={search}
                onChange={e => setSearchParams(e.target.value ? { search: e.target.value } : {})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Price Range (EGP)</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sort By</h3>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
            {(activeCategory || search || minPrice || maxPrice) && (
              <button onClick={clearFilters}
                className="w-full text-sm text-orange-600 border border-orange-300 rounded-lg py-2 hover:bg-orange-50">
                ✕ Clear Filters
              </button>
            )}
          </div>
        </aside>

        <main className="md:w-3/4">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">No products found</p>
              <button onClick={clearFilters} className="mt-4 text-orange-600 underline">Show all products</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ProductsPage
