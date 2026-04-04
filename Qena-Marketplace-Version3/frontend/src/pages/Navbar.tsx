import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ShoppingCartIcon, UserIcon, MenuIcon, XIcon } from '@heroicons/react/outline'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            🏪 Qena Market
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-gray-700 hover:text-orange-600 transition">Products</Link>
            {user?.role === 'seller' && <Link to="/seller" className="text-gray-700 hover:text-orange-600">Dashboard</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="text-gray-700 hover:text-orange-600">Admin</Link>}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCartIcon className="h-6 w-6 text-gray-600 hover:text-orange-600" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <UserIcon className="h-6 w-6" />
                  <span>{user.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block transition-all">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
                  <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">Orders</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">Login</Link>
            )}
          </div>

          {/* Mobile button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t animate-fadeIn">
            <Link to="/products" className="block py-2">Products</Link>
            {user?.role === 'seller' && <Link to="/seller" className="block py-2">Dashboard</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="block py-2">Admin</Link>}
            <Link to="/cart" className="block py-2">Cart ({cartCount})</Link>
            {user ? (
              <>
                <Link to="/profile" className="block py-2">Profile</Link>
                <Link to="/orders" className="block py-2">Orders</Link>
                <button onClick={logout} className="block w-full text-left py-2 text-red-600">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block py-2 text-orange-600">Login</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar