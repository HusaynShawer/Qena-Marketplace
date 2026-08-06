import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';

const METHOD_LABELS: Record<string, string> = {
  vodafone_cash: '📱 فودافون كاش',
  instapay: '🏦 إنستاباي',
};

type Withdrawal = {
  id: string;
  amount: number;
  method: 'vodafone_cash' | 'instapay';
  account_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  transaction_ref?: string;
  admin_note?: string;
  seller_name?: string;
  shop_name?: string;
};

type WalletItem = {
  id: string;
  balance: number;
  total_earned: number;
  seller_name: string;
  shop_name: string;
};

export default function AdminPayments() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'withdrawals' | 'wallets'>('withdrawals');

  // Action states
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actingLoading, setActingLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [wRes, wlRes] = await Promise.all([
        api.get('/wallet/admin/withdrawals'),
        api.get('/wallet/admin/wallets'),
      ]);
      setWithdrawals(wRes.data || []);
      setWallets(wlRes.data || []);
    } catch (e: any) {
      setError('مقدرناش نجيب البيانات، جرب تاني');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    setActingLoading(true);
    setError('');
    try {
      await api.post(`/wallet/admin/withdrawals/${id}/approve`);
      setActingId(null);
      setActionType(null);
      await fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'حصل مشكلة في الموافقة، جرب تاني');
    } finally {
      setActingLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActingLoading(true);
    setError('');
    try {
      const url = rejectNote
        ? `/wallet/admin/withdrawals/${id}/reject?admin_note=${encodeURIComponent(rejectNote)}`
        : `/wallet/admin/withdrawals/${id}/reject`;
      await api.post(url);
      setActingId(null);
      setActionType(null);
      setRejectNote('');
      await fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'حصل مشكلة في الرفض، جرب تاني');
    } finally {
      setActingLoading(false);
    }
  };

  const pending = useMemo(
    () => withdrawals.filter((w) => w.status === 'pending'),
    [withdrawals]
  );
  const history = useMemo(
    () => withdrawals.filter((w) => w.status !== 'pending'),
    [withdrawals]
  );

  const totalPendingAmount = useMemo(
    () => pending.reduce((sum, w) => sum + w.amount, 0),
    [pending]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="flex gap-2 mb-6">
          <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 إدارة المدفوعات</h1>
        <p className="text-gray-500 mt-1">
          راجع طلبات السحب وحوّل الفلوس للبائعين بسرعة
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError('')} className="mr-auto text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium mb-1">طلبات بانتظارك</p>
          <p className="text-2xl font-black text-orange-700">
            {pending.length} <span className="text-sm font-normal">طلب</span>
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">إجمالي المبالغ المعلقة</p>
          <p className="text-2xl font-black text-gray-800">
            {totalPendingAmount.toLocaleString()}{' '}
            <span className="text-sm font-normal">جنيه</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('withdrawals')}
          className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${
            tab === 'withdrawals'
              ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          طلبات السحب
          {pending.length > 0 && (
            <span className="mr-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('wallets')}
          className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${
            tab === 'wallets'
              ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          محافظ البائعين
        </button>
      </div>

      {tab === 'withdrawals' ? (
        <div className="space-y-8">
          {/* Pending Section */}
          {pending.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                بانتظار التحويل ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-xl text-gray-900">
                            {w.amount.toLocaleString()} جنيه
                          </p>
                          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
                            ⏳ جديد
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {w.shop_name || 'متجر'} —{' '}
                          <span className="text-gray-900 font-medium">
                            {w.seller_name || 'بائع'}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="bg-gray-50 px-2 py-1 rounded-lg">
                            {METHOD_LABELS[w.method]}
                          </span>
                          <span className="font-mono font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                            {w.account_number}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          📅 طلب بتاريخ{' '}
                          {new Date(w.created_at).toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action Area */}
                    {actingId === w.id ? (
                      <div className="border-t border-gray-100 pt-4">
                        {actionType === 'reject' ? (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              ليه رافض الطلب؟ (اختياري بس مفيد للبائع)
                            </label>
                            <input
                              type="text"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder="مثلاً: الرقم غلط، أو الحساب مش نشط"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(w.id)}
                                disabled={actingLoading}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition"
                              >
                                {actingLoading ? 'جاري الرفض...' : '❌ تأكيد الرفض'}
                              </button>
                              <button
                                onClick={() => {
                                  setActingId(null);
                                  setActionType(null);
                                  setRejectNote('');
                                }}
                                className="px-5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              هتتم الموافقة على سحب{' '}
                              <span className="font-bold text-gray-900">
                                {w.amount.toLocaleString()} جنيه
                              </span>{' '}
                              لـ <span className="font-bold">{w.seller_name || 'البائع'}</span>
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(w.id)}
                                disabled={actingLoading}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition"
                              >
                                {actingLoading ? 'جاري التحويل...' : '✅ تمام، حوّلت'}
                              </button>
                              <button
                                onClick={() => {
                                  setActingId(null);
                                  setActionType(null);
                                }}
                                className="px-5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 border-t border-gray-100 pt-4">
                        <button
                          onClick={() => {
                            setActingId(w.id);
                            setActionType('approve');
                          }}
                          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 transition"
                        >
                          ✅ تم التحويل
                        </button>
                        <button
                          onClick={() => {
                            setActingId(w.id);
                            setActionType('reject');
                          }}
                          className="flex-1 bg-white border border-red-200 text-red-600 py-2.5 rounded-xl font-bold hover:bg-red-50 transition"
                        >
                          ❌ رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-500 mb-4">السجل ({history.length})</h2>
              <div className="space-y-3">
                {history.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">
                          {w.amount.toLocaleString()} جنيه
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            w.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {w.status === 'approved' ? '✅ تم التحويل' : '❌ مرفوض'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {w.shop_name || 'متجر'} — {METHOD_LABELS[w.method]}: {w.account_number}
                      </p>
                      {w.transaction_ref && (
                        <p className="text-xs text-green-600 mt-1">
                          🏷️ رقم العملية: {w.transaction_ref}
                        </p>
                      )}
                      {w.admin_note && (
                        <p className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded-lg inline-block">
                          ملاحظة: {w.admin_note}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(w.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {withdrawals.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-5xl mb-4">🎉</p>
              <p className="text-gray-600 font-medium">مفيش طلبات سحب معلقة</p>
              <p className="text-gray-400 text-sm mt-1">كل البائعين مستلمين فلوسهم</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="font-bold text-gray-900 mb-4">محافظ البائعين</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {(w.seller_name || 'ب')[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{w.shop_name || 'متجر'}</p>
                    <p className="text-sm text-gray-500">{w.seller_name || 'بائع'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-[10px] text-orange-600 font-medium mb-1">الرصيد المتاح</p>
                    <p className="font-black text-orange-700 text-lg">
                      {w.balance.toLocaleString()} ج
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-[10px] text-green-600 font-medium mb-1">إجمالي الأرباح</p>
                    <p className="font-black text-green-700 text-lg">
                      {w.total_earned.toLocaleString()} ج
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {wallets.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 col-span-2">
                <p className="text-5xl mb-4">🏪</p>
                <p className="text-gray-600 font-medium">مفيش محافظ لحد دلوقتي</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}