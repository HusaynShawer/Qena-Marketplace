import React, { useEffect, useState } from 'react'
import api from '../../api/client'

const METHOD_LABELS: Record<string, string> = {
  vodafone_cash: '📱 فودافون كاش',
  instapay: '🏦 إنستاباي',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ في الانتظار',
  approved: '✅ تم التحويل',
  rejected: '❌ مرفوض',
}

export default function SellerWallet() {
  const [wallet, setWallet] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'vodafone_cash', account_number: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      const [w, wd] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/withdrawals'), 
      ])
      setWallet(w.data)
      setWithdrawals(wd.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleWithdraw = async () => {
    setError('')
    if (!form.amount || !form.account_number) { setError('كمّل كل الحقول'); return }
    setSubmitting(true)
    try {
      await api.post('/wallet/withdraw', {
        amount: parseFloat(form.amount),
        method: form.method,
        account_number: form.account_number,
      })
      setShowForm(false)
      setForm({ amount: '', method: 'vodafone_cash', account_number: '' })
      await fetchData()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'حصل خطأ')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="container mx-auto px-4 py-8"><p>جاري التحميل...</p></div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">💰 محفظتي</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-orange-100 text-sm mb-1">الرصيد المتاح</p>
          <p className="text-4xl font-black">{wallet?.balance?.toLocaleString() || 0}</p>
          <p className="text-orange-200 text-sm">جنيه مصري</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-green-100 text-sm mb-1">إجمالي الأرباح</p>
          <p className="text-4xl font-black">{wallet?.total_earned?.toLocaleString() || 0}</p>
          <p className="text-green-200 text-sm">جنيه مصري</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="mb-8">
        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition">
            💸 اطلب سحب فلوس
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 border border-orange-100">
            <h2 className="font-bold text-lg mb-4">طلب سحب</h2>
            {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (جنيه) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="الحد الأدنى 50 جنيه"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الاستلام *</label>
                <select value={form.method} onChange={e => setForm({...form, method: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="vodafone_cash">📱 فودافون كاش</option>
                  <option value="instapay">🏦 إنستاباي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم المحفظة / الحساب *</label>
                <input type="text" value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})}
                  placeholder="01xxxxxxxxx"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleWithdraw} disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50">
                  {submitting ? 'جاري الإرسال...' : '✅ إرسال الطلب'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-6 border border-gray-300 rounded-lg hover:bg-gray-50">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4">📊 المعاملات الأخيرة</h2>
        {wallet?.transactions?.length === 0 ? (
          <p className="text-gray-400 text-center py-8">مفيش معاملات لحد دلوقتي</p>
        ) : (
          <div className="space-y-3">
            {wallet?.transactions?.map((t: any) => (
              <div key={t.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm border">
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
                <p className={`font-bold text-lg ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString()} ج
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Requests */}
      <div>
        <h2 className="font-bold text-lg mb-4">📋 طلبات السحب</h2>
        {withdrawals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">مفيش طلبات سحب</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{w.amount.toLocaleString()} جنيه</p>
                    <p className="text-sm text-gray-500">{METHOD_LABELS[w.method]} — {w.account_number}</p>
                    <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString('ar-EG')}</p>
                    {w.transaction_ref && <p className="text-xs text-green-600 mt-1">رقم العملية: {w.transaction_ref}</p>}
                    {w.admin_note && <p className="text-xs text-red-500 mt-1">ملاحظة: {w.admin_note}</p>}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[w.status]}`}>
                    {STATUS_LABEL[w.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
