import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

interface Product {
  id: string          // ✅ Fixed: UUID comes as string from backend
  name: string
  price: number
  stock: number
  image_url: string | null
  is_active: boolean
}

const SellerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sellers/me/products')
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      alert('Failed to delete product.')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/sellers/me/products/${id}`, { is_active: !currentStatus })
      setProducts(prev =>
        prev.map(p =>
          p.id === id ? { ...p, is_active: !currentStatus } : p
        )
      )
    } catch (error) {
      alert('Failed to update product status.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link
          to="/seller/products/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500 mb-4">No products yet.</p>
          <Link
            to="/seller/products/new"
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            + Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                {p.image_url
                  ? <img src={p.image_url} className="w-full h-full object-cover" alt={p.name} />
                  : <span className="text-4xl">📦</span>
                }
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{p.name}</h3>
                <p className="text-orange-600 font-bold">{p.price.toLocaleString()} EGP</p>
                <p className="text-gray-400 text-sm">Stock: {p.stock}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {/* ✅ Fixed: navigates to edit page with correct string UUID */}
                  <Link
                    to={`/seller/products/edit/${p.id}`}
                    className="flex-1 text-center border border-gray-300 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="flex-1 border border-red-200 text-red-500 py-1.5 rounded-lg text-sm hover:bg-red-50"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    className={`flex-1 border py-1.5 rounded-lg text-sm ${
                      p.is_active
                        ? 'border-green-200 text-green-600 hover:bg-green-50'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {p.is_active ? '🟢 Active' : '⚪ Inactive'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SellerProducts