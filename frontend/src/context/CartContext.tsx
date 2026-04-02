import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  product?: {
    name: string
    price: number
    image_url: string
  }
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (productId: number, quantity?: number) => Promise<void>
  removeFromCart: (itemId: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  cartTotal: number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  const fetchCart = async () => {
    if (!token) {
      setCart([])
      return
    }
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setCart(data.items || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [token])

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!token) {
      window.location.href = '/login'
      return
    }
    try {
      await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity })
      })
      await fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const removeFromCart = async (itemId: number) => {
    try {
      await fetch(`${API_URL}/cart/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      await fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await fetch(`${API_URL}/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      })
      await fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const cartTotal = cart.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartTotal, loading }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}