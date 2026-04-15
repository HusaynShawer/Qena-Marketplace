import { useEffect, useState } from "react";
import api from "../../api/client";

type OrderItem = {
  product_name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_city: string;
  buyer_notes: string;
  items: OrderItem[];
};

const STATUSES = [
  { value: "pending",          label: "Pending" },
  { value: "confirmed",        label: "Confirmed" },
  { value: "shipped",          label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered",        label: "Delivered" },
  { value: "cancelled",        label: "Cancelled" },
];

const STATUS_COLOR: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-800",
  confirmed:        "bg-blue-100 text-blue-800",
  shipped:          "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered:        "bg-green-100 text-green-800",
  cancelled:        "bg-red-100 text-red-800",
};

// ── Buyer info modal ───────────────────────────────────────────────────────────
function BuyerModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Buyer Info — Order #{order.id}</h2>
        <p className="text-sm text-gray-400 mb-5">Delivery details for this order</p>

        <div className="space-y-3 text-sm">
          <InfoRow label="Name"    value={order.buyer_name} />
          <InfoRow label="Email"   value={order.buyer_email} />
          <InfoRow label="Phone"   value={order.buyer_phone} />
          <InfoRow label="Address" value={order.buyer_address} />
          <InfoRow label="City"    value={order.buyer_city} />
          {order.buyer_notes && <InfoRow label="Notes" value={order.buyer_notes} />}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-600">
                <span>{item.product_name} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} EGP</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold text-gray-900 mt-3 pt-3 border-t border-gray-100">
            <span>Total</span>
            <span>{order.total_amount.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 font-medium text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800">{value || <span className="text-gray-300 italic">—</span>}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SellerOrdersPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating]     = useState<number | null>(null);
  const [statusMsg, setStatusMsg]   = useState<Record<number, string>>({});

  useEffect(() => {
    api.get("/orders/seller/all")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setStatusMsg((prev) => ({ ...prev, [orderId]: "Updated!" }));
      setTimeout(() => setStatusMsg((prev) => ({ ...prev, [orderId]: "" })), 2000);
    } catch {
      setStatusMsg((prev) => ({ ...prev, [orderId]: "Failed to update." }));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px] text-gray-500">Loading orders…</div>
  );

  if (!orders.length) return (
    <div className="flex items-center justify-center min-h-[300px] text-gray-500">No orders yet.</div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Update</th>
              <th className="px-4 py-3">Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-700">#{order.id}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{order.buyer_name || "—"}</div>
                  <div className="text-xs text-gray-400">{order.buyer_email || ""}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {order.total_amount.toFixed(2)} EGP
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50">
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {statusMsg[order.id] && (
                      <span className={`text-xs font-medium ${statusMsg[order.id] === "Updated!" ? "text-green-600" : "text-red-500"}`}>
                        {statusMsg[order.id]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(order)}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg transition">
                    View buyer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <BuyerModal order={selectedOrder} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}