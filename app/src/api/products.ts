import api from './client'
import type { Product } from '../types/product'

export const getProducts = async (queryString: string = ''): Promise<Product[]> => {
  const res = await api.get(`/products?${queryString}`)
  return res.data
}

export const getProduct = async (id: number): Promise<Product> => {
  const res = await api.get(`/products/${id}`)
  return res.data
}
