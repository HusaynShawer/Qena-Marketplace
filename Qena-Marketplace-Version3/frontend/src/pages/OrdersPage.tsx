import { useEffect, useState } from "react";
import api from "../api/client";

type OrderItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_city: string;
  buyer_notes: string;
  items: OrderItem[];
};

const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed" },
  { key: "confirmed",        label: "Confirmed" },
  { key: "shipped",          label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered",        label: "Delivered" },
];

const STATUS_COLOR: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-800",
  confirmed:        "bg-blue-100 text-blue-800",
  shipped:          "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered:        "bg-green-100 text-green-800",
  cancelled:        "bg-red-100 text-red-800",
};

function TrackingTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 mt-3 text-red-600 font-medium text-sm">
        <span>Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const done    = idx <= currentIdx;
          const active  = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done
                    ? active
                      ? "bg-blue-600 border-blue-600 text-white scale-110"
                      : "bg-blue-500 border-blue-500 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                  }`}>
                  {done && !active ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] mt-1 text-center leading-tight w-16
                  ${done ? "text-blue-700 font-medium" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 ${idx < currentIdx ? "bg-blue-500" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api.get("/orders/")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Loading orders…</div>
  );

  if (!orders.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-500">
      <p className="text-xl font-semibold">No orders yet</p>
      <a href="/products" className="text-blue-600 underline text-sm">Start shopping</a>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const isOpen = expanded === order.id;
          return (
            <div key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header row */}
              <button
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                onClick={() => setExpanded(isOpen ? null : order.id)}>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Order #{order.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{order.total_amount.toFixed(2)} EGP</span>
                  <span className="text-gray-400 text-lg">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  {/* Tracking */}
                  <TrackingTimeline status={order.status} />

                  {/* Items */}
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>{(item.price * item.quantity).toFixed(2)} EGP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery info */}
                  {(order.buyer_address || order.buyer_phone) && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-800 mb-1">Delivery info</p>
                      {order.buyer_phone   && <p><span className="font-medium">Phone:</span> {order.buyer_phone}</p>}
                      {order.buyer_address && <p><span className="font-medium">Address:</span> {order.buyer_address}</p>}
                      {order.buyer_city    && <p><span className="font-medium">City:</span> {order.buyer_city}</p>}
                      {order.buyer_notes   && <p><span className="font-medium">Notes:</span> {order.buyer_notes}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}