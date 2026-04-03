import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/client'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  product?: { name: string; price: number; image_url: string }
}

const CartContext = createContext<any>(null)

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const { token } = useAuth()

  const fetchCart = async () => {
    if (!token) { setCart([]); return }
    const res = await api.get('/cart')
    setCart(res.data.items || [])
  }

  useEffect(() => { fetchCart() }, [token])

  const addToCart = async (productId: number, quantity: number = 1) => {
    await api.post('/cart', { product_id: productId, quantity })
    await fetchCart()
  }

  const removeFromCart = async (itemId: number) => {
    await api.delete(`/cart/${itemId}`)
    await fetchCart()
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    await api.put(`/cart/${itemId}`, { quantity })
    await fetchCart()
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartTotal }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)