export interface Product {
  id: number
  name: string
  description?: string
  price: number
  stock?: number
  image_url?: string
  category?: string
  seller_id?: number
  created_at?: string
}
