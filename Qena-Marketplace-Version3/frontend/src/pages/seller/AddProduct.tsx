import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

const AddProduct: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', category_id: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) {
      alert('Please fill in name, price and stock')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      formData.append('stock', form.stock)
      if (form.category_id) formData.append('category_id', form.category_id)
      if (imageFile) formData.append('image', imageFile)

      await api.post('/products/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/seller/products')
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Add New Product</h1>
      <div className="bg-white rounded-lg shadow-md p-6 space-y-5">

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 transition"
            onClick={() => document.getElementById('imgInput')?.click()}
          >
            {imagePreview
              ? <img src={imagePreview} className="mx-auto max-h-48 object-contain rounded" />
              : <div><div className="text-4xl mb-2">📷</div><p className="text-gray-400">Click to upload image</p></div>
            }
          </div>
          <input id="imgInput" type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input name="name" value={form.name} onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="e.g. iPhone 14 Pro" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            rows={4} placeholder="Describe your product..." />
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (EGP) *</label>
            <input name="price" type="number" value={form.price} onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input name="stock" type="number" value={form.stock} onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="0" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
            <option value="">Select category...</option>
            <option value="1">Electronics</option>
            <option value="2">Clothing & Fashion</option>
            <option value="3">Home & Garden</option>
            <option value="4">Sports & Hobbies</option>
            <option value="5">Food & Groceries</option>
            <option value="6">Books & Education</option>
            <option value="7">Cars & Vehicles</option>
            <option value="8">Other</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-2">
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition">
            {loading ? 'Publishing...' : '🚀 Publish Product'}
          </button>
          <button onClick={() => navigate('/seller/products')}
            className="px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
