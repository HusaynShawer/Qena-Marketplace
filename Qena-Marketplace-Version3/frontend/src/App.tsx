import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import SellerDashboard from './pages/seller/Dashboard'
import SellerProducts from './pages/seller/Products'
import SellerOrders from './pages/seller/Orders'
import AddProduct from './pages/seller/AddProduct'
import AdminDashboard from './pages/admin/Dashboard'
import AdminSellers from './pages/admin/Sellers'
import AdminOrders from './pages/admin/Orders'

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6 animate-float">🛍️</div>
      <h1 className="text-4xl font-bold text-slate-800 mb-3">404 — Page Not Found</h1>
      <p className="text-slate-500 mb-8">Looks like you wandered off the marketplace!</p>
      <a href="/" className="btn-primary">Back to Home</a>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/products"        element={<ProductsPage />} />
          <Route path="/products/:id"    element={<ProductDetailPage />} />
          <Route path="/cart"            element={<CartPage />} />
          <Route path="/checkout"        element={<CheckoutPage />} />
          <Route path="/orders"          element={<OrdersPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/seller"          element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/orders"   element={<SellerOrders />} />
          <Route path="/seller/products/new" element={<AddProduct />} />
          <Route path="/admin"           element={<AdminDashboard />} />
          <Route path="/admin/sellers"   element={<AdminSellers />} />
          <Route path="/admin/orders"    element={<AdminOrders />} />
          <Route path="*"               element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}