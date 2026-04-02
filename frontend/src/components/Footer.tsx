import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Qena Marketplace</h3>
            <p className="text-gray-400">
              Your local online marketplace for Qena and surrounding areas. 
              Shop local, support local businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-orange-500">Products</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-orange-500">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-orange-500">Contact</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-orange-500">FAQ</Link></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-xl font-bold mb-4">For Sellers</h3>
            <ul className="space-y-2">
              <li><Link to="/seller/apply" className="text-gray-400 hover:text-orange-500">Become a Seller</Link></li>
              <li><Link to="/seller/dashboard" className="text-gray-400 hover:text-orange-500">Seller Dashboard</Link></li>
              <li><Link to="/seller/guidelines" className="text-gray-400 hover:text-orange-500">Seller Guidelines</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>📍 Qena, Egypt</li>
              <li>📧 info@qenamarketplace.com</li>
              <li>📞 +20 123 456 789</li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-orange-500">📘</a>
              <a href="#" className="text-gray-400 hover:text-orange-500">📷</a>
              <a href="#" className="text-gray-400 hover:text-orange-500">🐦</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Qena Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer