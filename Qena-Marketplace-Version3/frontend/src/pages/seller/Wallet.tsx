import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';

const METHOD_LABELS: Record<string, string> = {
  vodafone_cash: '📱 فودافون كاش',
  instapay: '🏦 إنستاباي',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ بانتظار المراجعة',
  approved: '✅ تم التحويل',
  rejected: '❌ تم الرفض',
};

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
  reference?: string;        // رقم العملية الداخلية
  balance_after?: number;    // الرصيد بعد العملية
  source?: string;           // مصدر العملية (طلب #123، سحب، إلخ)
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
};

type WalletData = {
  balance: number;
  total_earned: number;
  transactions: Transaction[];
};

export default function SellerWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', method: 'vodafone_cash', account_number: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, wdRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/withdrawals'),
      ]);
      setWallet(wRes.data);
      setWithdrawals(wdRes.data || []);
    } catch {
      // silent or toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingWithdrawal = useMemo(
    () => withdrawals.find((w) => w.status === 'pending'),
    [withdrawals]
  );

  const validate = () => {
    const e: Record<string, string> = {};
    const amt = parseFloat(form.amount);

    if (!form.amount || isNaN(amt) || amt <= 0) {
      e.amount = 'اكتب المبلغ اللي عايز تسحبه';
    } else if (amt < 50) {
      e.amount = 'الحد الأدنى للسحب ٥٠ جنيه';
    } else if (wallet && amt > wallet.balance) {
      e.amount = 'المبلغ أكبر من رصيدك المتاح';
    }

    if (!form.account_number.trim()) {
      e.account_number = 'اكتب رقم المحفظة أو الحساب';
    } else if (form.method === 'vodafone_cash' && !/^(01)\d{9}$/.test(form.account_number.trim())) {
      e.account_number = 'رقم فودافون كاش لازم يبدأ بـ 01 ويكون 11 رقم';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleWithdraw = async () => {
    setSuccessMsg('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/wallet/withdraw', {
        amount: parseFloat(form.amount),
        method: form.method,
        account_number: form.account_number.trim(),
      });
      setShowForm(false);
      setForm({ amount: '', method: 'vodafone_cash', account_number: '' });
      setSuccessMsg('🎉 تم إرسال طلب السحب! هنراجعه في أسرع وقت.');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'حصل مشكلة، جرب تاني';
      setErrors({ general: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // تجميع المعاملات حسب اليوم
  const groupedTransactions = useMemo(() => {
    if (!wallet?.transactions) return [];
    const groups: Record<string, Transaction[]> = {};
    const now = new Date();

    wallet.transactions.forEach((t) => {
      const d = new Date(t.created_at);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

      let label: string;
      if (diffDays === 0) label = 'اليوم';
      else if (diffDays === 1) label = 'أمس';
      else if (diffDays < 7) label = 'الأسبوع ده';
      else if (diffDays < 30) label = d.toLocaleDateString('ar-EG', { month: 'long' });
      else label = d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });

    return Object.entries(groups);
  }, [wallet?.transactions]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 h-32 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="col-span-2 h-32 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 محفظتك</h1>
        <p className="text-gray-500 text-sm mt-1">
          {wallet
            ? `عندك ${wallet.balance.toLocaleString()} جنيه متاحين للسحب`
            : 'تحتاج مساعدة؟ تواصل معانا'}
        </p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-5 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm font-medium animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Pending Withdrawal Warning */}
      {pendingWithdrawal && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-600 text-xl">⏳</span>
          <div>
            <p className="text-sm font-bold text-amber-900">عندك طلب سحب بانتظار المراجعة</p>
            <p className="text-xs text-amber-700 mt-1">
              طلبت سحب{' '}
              <span className="font-bold">{pendingWithdrawal.amount.toLocaleString()} جنيه</span>{' '}
              بتاريخ {new Date(pendingWithdrawal.created_at).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="col-span-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg shadow-orange-100">
          <p className="text-orange-100 text-xs font-medium mb-1">الرصيد المتاح</p>
          <p className="text-3xl font-black tracking-tight">
            {wallet?.balance?.toLocaleString() || 0}
            <span className="text-base font-normal text-orange-200 mr-1">جنيه</span>
          </p>
          <p className="text-orange-200 text-xs mt-2 opacity-80">
            تقدر تسحبهم في أي وقت
          </p>
        </div>
        <div className="col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <p className="text-gray-400 text-xs font-medium mb-1">إجمالي الأرباح</p>
          <p className="text-2xl font-bold text-gray-800">
            {wallet?.total_earned?.toLocaleString() || 0}
          </p>
          <p className="text-gray-400 text-xs mt-1">جنيه مصري</p>
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="mb-10">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={!!pendingWithdrawal}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pendingWithdrawal ? '⏳ فيه طلب سحب تحت المراجعة' : '💸 اطلب سحب فلوس'}
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-1">طلب سحب جديد</h2>
            <p className="text-xs text-gray-400 mb-4">
              الحد الأدنى ٥٠ جنيه، والحد الأقصى رصيدك المتاح ({wallet?.balance?.toLocaleString()} ج)
            </p>

            {errors.general && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  المبلغ (جنيه)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => {
                    setForm({ ...form, amount: e.target.value });
                    if (errors.amount) setErrors((p) => {
                      const n = { ...p };
                      delete n.amount;
                      return n;
                    });
                  }}
                  placeholder="مثلاً 500"
                  className={`w-full border rounded-xl px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
                    errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.amount}</p>
                )}
                {wallet && !errors.amount && form.amount && parseFloat(form.amount) > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    هيتبقى معاك{' '}
                    <span className="font-medium text-gray-600">
                      {(wallet.balance - parseFloat(form.amount)).toLocaleString()} جنيه
                    </span>
                  </p>
                )}
              </div>

              {/* Method as buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  طريقة الاستلام
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['vodafone_cash', 'instapay'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm({ ...form, method: m })}
                      className={`border rounded-xl py-3 px-4 text-sm font-medium transition text-center ${
                        form.method === m
                          ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  رقم المحفظة / الحساب
                </label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => {
                    setForm({ ...form, account_number: e.target.value });
                    if (errors.account_number) setErrors((p) => {
                      const n = { ...p };
                      delete n.account_number;
                      return n;
                    });
                  }}
                  placeholder={form.method === 'vodafone_cash' ? '01xxxxxxxxx' : 'رقم إنستاباي'}
                  className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
                    errors.account_number ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.account_number && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.account_number}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition"
                >
                  {submitting ? 'جاري الإرسال...' : '✅ تأكيد الطلب'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="px-6 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions — Rich Details */}
      <div className="mb-10">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span> حركات المحفظة
        </h2>

        {!wallet?.transactions || wallet.transactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🌵</p>
            <p className="text-gray-500 text-sm">لسه مفيش حركات هنا</p>
            <p className="text-gray-400 text-xs mt-1">أول ما تبيع حاجة هتظهر لك هنا</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map(([label, items]) => (
              <div key={label}>
                <p className="text-xs font-bold text-gray-400 mb-3 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  {label}
                </p>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Icon based on type */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                              t.type === 'credit'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-500'
                            }`}
                          >
                            {t.type === 'credit' ? '💵' : '💸'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 leading-snug">
                              {t.description}
                            </p>
                            {/* Source / Reference line */}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] text-gray-400">
                                {new Date(t.created_at).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                •{' '}
                                {new Date(t.created_at).toLocaleDateString('ar-EG', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                              {t.reference && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                  Ref: {t.reference}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <p
                            className={`font-bold text-base ${
                              t.type === 'credit' ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            {t.type === 'credit' ? '+' : '-'} {t.amount.toLocaleString()} ج
                          </p>
                          {t.balance_after !== undefined && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              الرصيد: {t.balance_after.toLocaleString()} ج
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Extra details row */}
                      {t.source && (
                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                            {t.source}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Requests */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📋</span> طلبات السحب
        </h2>

        {withdrawals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-gray-500 text-sm">مفيش طلبات سحب لحد دلوقتي</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg text-gray-900">
                      {w.amount.toLocaleString()} جنيه
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {METHOD_LABELS[w.method]} —{' '}
                      <span className="font-mono font-medium text-gray-700">
                        {w.account_number}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STYLES[w.status]}`}
                  >
                    {STATUS_LABELS[w.status]}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-3">
                  <span>
                    📅{' '}
                    {new Date(w.created_at).toLocaleDateString('ar-EG', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {w.transaction_ref && (
                    <span className="text-emerald-600 font-medium">
                      🏷️ رقم العملية: {w.transaction_ref}
                    </span>
                  )}
                </div>

                {w.admin_note && (
                  <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <span className="font-bold">ملاحظة الأدمن:</span> {w.admin_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}