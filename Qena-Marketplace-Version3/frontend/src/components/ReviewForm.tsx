import React, { useState } from 'react'
import api from '../api/client'

interface Props {
  productId: string
  onReviewAdded: () => void
}

export default function ReviewForm({ productId, onReviewAdded }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('اختار عدد النجوم')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating,
        comment: comment.trim() || null,
      })
      setRating(0)
      setComment('')
      onReviewAdded()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'حصل خطأ، جرب تاني')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100">
      <h3 className="font-bold text-lg mb-4 text-slate-800">أضف تقييمك</h3>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
          >
            {star <= (hover || rating) ? '⭐' : '☆'}
          </button>
        ))}
        <span className="mr-3 text-sm text-gray-500">
          {rating > 0 ? `${rating} من 5` : 'اختار تقييم'}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب رأيك في المنتج... (اختياري)"
        rows={3}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3 resize-none"
      />

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition"
      >
        {loading ? '⏳ جاري الإرسال...' : 'إرسال التقييم'}
      </button>
    </form>
  )
}