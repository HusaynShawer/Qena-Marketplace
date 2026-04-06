import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
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
import VendorPage from './pages/VendorPage'
import SellerDashboard from './pages/seller/Dashboard'
import SellerProducts from './pages/seller/Products'
import SellerOrders from './pages/seller/Orders'
import AddProduct from './pages/seller/AddProduct'
import SellerWallet from './pages/seller/Wallet'
import AdminDashboard from './pages/admin/Dashboard'
import AdminSellers from './pages/admin/Sellers'
import AdminOrders from './pages/admin/Orders'
import AdminPayments from './pages/admin/Payments'

// ── Guards ──
function RequireAuth({ roles }: { roles?: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🛍️</div>
      <h1 className="text-4xl font-bold text-slate-800 mb-3">404 — Page Not Found</h1>
      <p className="text-slate-500 mb-8">Looks like you wandered off the marketplace!</p>
      <a href="/" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700">Back to Home</a>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"               element={<HomePage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/products"       element={<ProductsPage />} />
          <Route path="/products/:id"   element={<ProductDetailPage />} />
          <Route path="/vendor/:id"     element={<VendorPage />} />
          <Route path="/cart"           element={<CartPage />} />

          {/* Logged in users only */}
          <Route element={<RequireAuth />}>
            <Route path="/checkout"    element={<CheckoutPage />} />
            <Route path="/orders"      element={<OrdersPage />} />
            <Route path="/profile"     element={<ProfilePage />} />
          </Route>

          {/* Sellers only */}
          <Route element={<RequireAuth roles={['seller']} />}>
            <Route path="/seller"                element={<SellerDashboard />} />
            <Route path="/seller/products"       element={<SellerProducts />} />
            <Route path="/seller/products/new"   element={<AddProduct />} />
            <Route path="/seller/orders"         element={<SellerOrders />} />
            <Route path="/seller/wallet"         element={<SellerWallet />} />
          </Route>

          {/* Admins only */}
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="/admin"               element={<AdminDashboard />} />
            <Route path="/admin/sellers"       element={<AdminSellers />} />
            <Route path="/admin/orders"        element={<AdminOrders />} />
            <Route path="/admin/payments"      element={<AdminPayments />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
