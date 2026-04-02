import { useEffect, useState } from 'react'
import { getProducts } from '../api/products'
import { Product } from '../types/product'

interface Filters {
  category?: string
  minPrice?: string
  maxPrice?: string
  search?: string
}

export const useProducts = (filters: Filters) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filters.category) params.append('category', filters.category)
        if (filters.minPrice) params.append('min_price', filters.minPrice)
        if (filters.maxPrice) params.append('max_price', filters.maxPrice)
        if (filters.search) params.append('search', filters.search)
        const data = await getProducts(params.toString())
        setProducts(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [filters.category, filters.minPrice, filters.maxPrice, filters.search])

  return { products, loading, error }
}