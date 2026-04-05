import React, { useEffect, useState } from 'react'
import api from '../../api/client'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const METHOD_LABELS: Record<string, string> = {
  vodafone_cash: '📱 فودافون كاش',
  instapay: '🏦 إنستاباي',
}

export default function AdminPayments() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [tab, setTab] = useState<'withdrawals' | 'wallets'>('withdrawals')

  const fetchData = async () => {
    try {
      const [w, wl] = await Promise.all([
        api.get('/wallet/admin/withdrawals'),
        api.get('/wallet/admin/wallets'),
      ])
      setWithdrawals(w.data)
      setWallets(wl.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAction = async (id: number, status: string) => {
    try {
      await api.put(`/wallet/admin/withdrawals/${id}`, {
        status,
        transaction_ref: ref || null,
        admin_note: note || null,
      })
      setActionId(null)
      setRef('')
      setNote('')
      await fetchData()
    } catch {}
  }

  const pending = withdrawals.filter(w => w.status === 'pending')
  const done = withdrawals.filter(w => w.status !== 'pending')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">💰 إدارة المدفوعات</h1>
      <p className="text-gray-500 mb-8">راجع طلبات السحب وحوّل الفلوس للبائعين</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('withdrawals')}
          className={`px-6 py-2 rounded-full font-medium transition ${tab === 'withdrawals' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          طلبات السحب {pending.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pending.length}</span>}
        </button>
        <button onClick={() => setTab('wallets')}
          className={`px-6 py-2 rounded-full font-medium transition ${tab === 'wallets' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          محافظ البائعين
        </button>
      </div>

      {loading ? <p>جاري التحميل...</p> : tab === 'withdrawals' ? (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3 text-orange-600">⏳ طلبات تحتاج مراجعة ({pending.length})</h2>
              <div className="space-y-4">
                {pending.map(w => (
                  <div key={w.id} className="bg-white rounded-2xl shadow p-6 border-l-4 border-orange-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-xl">{w.amount.toLocaleString()} جنيه</p>
                        <p className="text-gray-600">{w.shop_name} — {w.seller_name}</p>
                        <p className="text-sm text-gray-500">{METHOD_LABELS[w.method]}: <span className="font-mono font-bold">{w.account_number}</span></p>
                        <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[w.status]}`}>⏳ في الانتظار</span>
                    </div>

                    {actionId === w.id ? (
                      <div className="space-y-3 border-t pt-4">
                        <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                          placeholder="رقم العملية (مطلوب للموافقة)"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <input type="text" value={note} onChange={e => setNote(e.target.value)}
                          placeholder="ملاحظة (اختياري)"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(w.id, 'approved')}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">
                            ✅ تم التحويل
                          </button>
                          <button onClick={() => handleAction(w.id, 'rejected')}
                            className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-bold hover:bg-red-200">
                            ❌ رفض
                          </button>
                          <button onClick={() => setActionId(null)}
                            className="px-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActionId(w.id)}
                        className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700">
                        اتخذ إجراء
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {done.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3 text-gray-500">السجل ({done.length})</h2>
              <div className="space-y-3">
                {done.map(w => (
                  <div key={w.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold">{w.amount.toLocaleString()} جنيه — {w.shop_name}</p>
                      <p className="text-sm text-gray-500">{METHOD_LABELS[w.method]}: {w.account_number}</p>
                      {w.transaction_ref && <p className="text-xs text-green-600">رقم العملية: {w.transaction_ref}</p>}
                      {w.admin_note && <p className="text-xs text-red-500">ملاحظة: {w.admin_note}</p>}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[w.status]}`}>
                      {w.status === 'approved' ? '✅ تم' : '❌ مرفوض'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {withdrawals.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">💸</div>
              <p>مفيش طلبات سحب لحد دلوقتي</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="font-bold text-lg mb-4">محافظ البائعين</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {wallets.map(w => (
              <div key={w.id} className="bg-white rounded-xl p-5 shadow-sm border">
                <p className="font-bold">{w.shop_name}</p>
                <p className="text-gray-500 text-sm mb-3">{w.seller_name}</p>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-400">الرصيد المتاح</p>
                    <p className="font-bold text-orange-600 text-lg">{w.balance.toLocaleString()} ج</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">إجمالي الأرباح</p>
                    <p className="font-bold text-green-600 text-lg">{w.total_earned.toLocaleString()} ج</p>
                  </div>
                </div>
              </div>
            ))}
            {wallets.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">مفيش محافظ لحد دلوقتي</p>}
          </div>
        </div>
      )}
    </div>
  )
}
