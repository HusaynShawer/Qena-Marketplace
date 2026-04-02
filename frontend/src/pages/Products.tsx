import { useState } from 'react'
import ProductList from '../components/Product/ProductList'
import ProductFilter from '../components/Product/ProductFilter'
import { useProducts } from '../hooks/useProducts'

const Products = () => {
  const [filters, setFilters] = useState({ category: '', minPrice: '', maxPrice: '', search: '' })
  const { products, loading, error } = useProducts(filters)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4">
          <ProductFilter filters={filters} setFilters={setFilters} />
        </aside>
        <main className="w-full md:w-3/4">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && <ProductList products={products} />}
        </main>
      </div>
    </div>
  )
}

export default Products