import { useState, useEffect, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
  image_url: string | null
  seller_id: number
  created_at: string
}

export default function SellerProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      // Filter only seller's products
      const myProducts = res.data.filter((p: Product) => p.seller_id === user?.id)
      setProducts(myProducts)
    } catch (err) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [user])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', category: '' })
    setImageFile(null)
    setImagePreview(null)
    setEditingProduct(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || ''
    })
    setImagePreview(product.image_url || null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('price', formData.price)
      data.append('stock', formData.stock)
      data.append('category', formData.category)
      if (imageFile) {
        data.append('image', imageFile)
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Product updated!')
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Product created!')
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${productId}`)
      toast.success('Product deleted!')
      fetchProducts()
    } catch (err) {
      toast.error('Failed to delete product')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">My Products</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your product listings</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No products yet</h2>
          <p className="text-slate-500 mb-6">Start selling by adding your first product</p>
          <button onClick={openAddModal} className="btn-primary">Add Your First Product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden group">
              {/* Image */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={`http://localhost:8000${product.image_url}`} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                )}
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="p-2 bg-white rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <PencilIcon className="h-5 w-5 text-slate-700" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                <p className="text-orange-500 font-bold text-lg">${product.price.toFixed(2)}</p>
                <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
                  <span>Stock: {product.stock}</span>
                  <span className="badge badge-gray">{product.category || 'Uncategorized'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-32 mx-auto object-contain" />
                    ) : (
                      <>
                        <PhotoIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Click to upload image</p>
                      </>
                    )}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field !h-24 resize-none"
                    rows={3}
                  />
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Books">Books</option>
                    <option value="Sports">Sports</option>
                    <option value="Food">Food</option>
                    <option value="Toys">Toys</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary !py-3"
                  >
                    {submitting ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
