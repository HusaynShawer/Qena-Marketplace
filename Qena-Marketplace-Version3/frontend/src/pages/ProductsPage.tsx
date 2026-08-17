import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

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
  const { user } = useAuth()

  const activeCategory = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sortBy = searchParams.get('sort') || 'newest'

  const [searchInput, setSearchInput] = useState(search)
  const [minInput, setMinInput] = useState(minPrice)
  const [maxInput, setMaxInput] = useState(maxPrice)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams)
      if (searchInput.trim()) newParams.set('search', searchInput.trim())
      else newParams.delete('search')
      setSearchParams(newParams)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch products based on filters and sorting
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        if (sortBy === 'recommended') {
          // Use the recommendation endpoint for logged-in users
          if (user) {
            const res = await api.get(`/recommendations/?page=1&per_page=100`)
            let recommended = Array.isArray(res.data) ? res.data : []
            // Apply category and search filters client-side
            if (activeCategory) {
              recommended = recommended.filter(p => p.category === activeCategory)
            }
            if (search) {
              const q = search.toLowerCase()
              recommended = recommended.filter(p => 
                p.name.toLowerCase().includes(q) || 
                (p.description && p.description.toLowerCase().includes(q))
              )
            }
            setAllProducts(recommended)
          } else {
            // If not logged in, fall back to newest products
            setAllProducts([])
          }
        } else {
          // Normal product fetch with server-side sorting for non-recommended options
          const params = new URLSearchParams()
          params.append('limit', '200')
          if (activeCategory) params.append('category', activeCategory)
          if (search) params.append('search', search)
          if (sortBy && sortBy !== 'recommended') params.append('sort', sortBy)
          const res = await api.get(`/products?${params.toString()}`)
          setAllProducts(Array.isArray(res.data) ? res.data : [])
        }
      } catch (err) {
        setAllProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [activeCategory, search, sortBy, user])

  // Client-side price filtering (applies to all cases)
  useEffect(() => {
    let filtered = [...allProducts]

    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice))
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice))

    // If sort is not 'recommended', we may need to sort again after price filter
    // (since the server sorting was done before price filter, we re-sort to maintain order)
    if (sortBy !== 'recommended') {
      if (sortBy === 'newest') {
        filtered.sort((a, b) => {
          const da = new Date(a.created_at || 0).getTime()
          const db = new Date(b.created_at || 0).getTime()
          return db - da
        })
      } else if (sortBy === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price)
      } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price)
      }
    }

    setProducts(filtered)
  }, [allProducts, minPrice, maxPrice, sortBy])

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) newParams.set(key, value)
    else newParams.delete(key)
    setSearchParams(newParams)
  }

  const handleCategoryClick = (q: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (q) newParams.set('category', q)
    else newParams.delete('category')
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchInput('')
    setMinInput('')
    setMaxInput('')
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
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Price Range (EGP)</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minInput}
                  onChange={e => { setMinInput(e.target.value); updateParam('minPrice', e.target.value) }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input type="number" placeholder="Max" value={maxInput}
                  onChange={e => { setMaxInput(e.target.value); updateParam('maxPrice', e.target.value) }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sort By</h3>
              <select value={sortBy} onChange={e => updateParam('sort', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                {user && <option value="recommended">⭐ Recommended For You</option>}
              </select>
            </div>
            {(activeCategory || search || minPrice || maxPrice || sortBy !== 'newest') && (
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