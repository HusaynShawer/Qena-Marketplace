import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import {
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  HomeIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/products', label: 'Products', icon: CubeIcon },
  ]

  // قائمة الـ dropdown حسب الدور
  const userMenuItems = [
    { to: '/profile', label: 'My Profile', Icon: UserIcon },
    { to: '/orders', label: 'My Orders', Icon: ClipboardDocumentListIcon },
    ...(user?.role === 'seller' ? [
      { to: '/seller', label: 'Seller Dashboard', Icon: ChartBarIcon },
      { to: '/seller/products', label: 'My Products', Icon: CubeIcon },
      { to: '/seller/orders', label: 'Orders Received', Icon: ClipboardDocumentListIcon },
      { to: '/seller/wallet', label: '💰 My Wallet', Icon: WalletIcon },
    ] : []),
    ...(user?.role === 'admin' ? [
      { to: '/admin', label: 'Admin Panel', Icon: ShieldCheckIcon },
      { to: '/admin/payments', label: '💰 Payments', Icon: WalletIcon },
    ] : []),
  ]

  return (
    <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-lg shadow-slate-200/60' : 'shadow-sm'}`}>
      {/* Top bar */}
      <div className="hero-gradient text-white text-xs text-center py-1.5 px-4 font-medium tracking-wide">
        🚀 Welcome to Qena Marketplace — Shop from the best local vendors!
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 orange-gradient rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="text-white text-lg font-bold">Q</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-black text-slate-800">Qena</span>
              <span className="text-xl font-black gradient-text">Market</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
                Search
              </button>
            </div>
          </form>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}>
                {label}
              </Link>
            ))}
            {user?.role === 'seller' && (
              <Link to="/seller"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname.startsWith('/seller')
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}>
                My Shop
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}>
                Admin
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">

            {/* Wallet shortcut for seller */}
            {user?.role === 'seller' && (
              <Link to="/seller/wallet"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition text-sm font-semibold">
                <WalletIcon className="h-5 w-5" />
                Wallet
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors group">
              <ShoppingCartIcon className="h-6 w-6 text-slate-600 group-hover:text-orange-500 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 orange-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDownIcon className={`hidden md:block h-4 w-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'seller' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    {userMenuItems.map(({ to, label, Icon }) => (
                      <Link key={to} to={to} onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-orange-500 transition-colors">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 !text-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
              {isMenuOpen ? <XMarkIcon className="h-6 w-6 text-slate-600" /> : <Bars3Icon className="h-6 w-6 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </form>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-colors">
                <Icon className="h-5 w-5" />{label}
              </Link>
            ))}
            {user?.role === 'seller' && (
              <>
                <Link to="/seller" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-colors">
                  <ChartBarIcon className="h-5 w-5" /> My Shop
                </Link>
                <Link to="/seller/wallet" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-orange-600 bg-orange-50 font-medium transition-colors">
                  <WalletIcon className="h-5 w-5" /> 💰 My Wallet
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-colors">
                <ShieldCheckIcon className="h-5 w-5" /> Admin Panel
              </Link>
            )}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center py-2.5 border border-orange-400 text-orange-500 rounded-xl font-semibold text-sm">Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center py-2.5 btn-primary !text-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
