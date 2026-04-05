import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/client'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  product?: { id: number; name: string; price: number; image_url: string; stock: number }
}

const CartContext = createContext<any>(null)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const { token } = useAuth()

  const fetchCart = async () => {
    if (!token) { setCart([]); setCartTotal(0); return }
    try {
      const res = await api.get('/cart/')
      setCart(res.data.items || [])
      setCartTotal(res.data.total || 0)
    } catch {
      setCart([])
      setCartTotal(0)
    }
  }

  useEffect(() => { fetchCart() }, [token])

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      await api.post('/cart/', { product_id: productId, quantity })
      await fetchCart()
    } catch {}
  }

  const removeFromCart = async (itemId: number) => {
    try {
      await api.delete(`/cart/${itemId}`)
      await fetchCart()
    } catch {}
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await api.put(`/cart/${itemId}`, { quantity })
      await fetchCart()
    } catch {}
  }

  const clearCart = async () => {
    try {
      await api.delete('/cart/')
      setCart([])
      setCartTotal(0)
    } catch {}
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
