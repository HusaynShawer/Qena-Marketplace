import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

interface Product {
  id: number
  name: string
  price: number
  image_url?: string
  description?: string
  stock: number
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (minPrice) params.append('min_price', minPrice)
      if (maxPrice) params.append('max_price', maxPrice)
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/products?${params}`)
      const data = await res.json()
      
      // Apply sorting
      let sorted = [...data]
      if (sortBy === 'price_asc') sorted.sort((a, b) => a.price - b.price)
      if (sortBy === 'price_desc') sorted.sort((a, b) => b.price - a.price)
      
      setProducts(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search, category, minPrice, maxPrice, sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Search</h3>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field mb-4"
            />
            
            <h3 className="font-semibold mb-3">Price Range</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-field"
              />
            </div>
            
            <h3 className="font-semibold mb-3">Sort By</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </aside>
        
        {/* Products Grid */}
        <main className="md:w-3/4">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">No products found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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