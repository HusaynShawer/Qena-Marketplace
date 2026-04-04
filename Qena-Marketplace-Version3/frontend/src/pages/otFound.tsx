import React from 'react'
import { Link } from 'react-router-dom'

const NotFound: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="text-8xl mb-4">404</div>
      <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
        Go Home
      </Link>
    </div>
  )
}

export default NotFound