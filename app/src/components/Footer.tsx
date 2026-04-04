import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 orange-gradient rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">Q</span>
            </div>
            <span className="text-xl font-black text-white">Qena<span className="gradient-text">Market</span></span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            The premier marketplace for Qena and surrounding areas. Connecting local vendors with customers since 2024.
          </p>
          <div className="flex gap-3 mt-5">
            {['📘','🐦','📸','▶️'].map((icon, i) => (
              <button key={i} className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-orange-500/20 transition-colors text-base">
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-bold text-white mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { to: '/products', label: 'All Products' },
              { to: '/products?category=electronics', label: 'Electronics' },
              { to: '/products?category=clothing',    label: 'Clothing' },
              { to: '/products?category=home',        label: 'Home & Garden' },
              { to: '/products?category=books',       label: 'Books' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-orange-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="font-bold text-white mb-4">Account</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { to: '/login',    label: 'Login' },
              { to: '/register', label: 'Register' },
              { to: '/orders',   label: 'My Orders' },
              { to: '/profile',  label: 'My Profile' },
              { to: '/cart',     label: 'Shopping Cart' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-orange-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Sell */}
        <div>
          <h4 className="font-bold text-white mb-4">Sell With Us</h4>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Start your own online shop. Reach thousands of customers in Qena and beyond.
          </p>
          <Link to="/register" className="btn-primary !py-2.5 !px-5 !text-sm">Start Selling →</Link>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-400"><span>📧</span><span>support@qenamarket.com</span></div>
            <div className="flex items-center gap-2 text-slate-400"><span>📞</span><span>+20 96 XXX XXXX</span></div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          {[
            { icon: '🚚', title: 'Free Shipping',  sub: 'On orders over $50' },
            { icon: '🔒', title: 'Secure Payment', sub: '100% protected' },
            { icon: '🔄', title: 'Easy Returns',   sub: '30-day policy' },
            { icon: '💬', title: '24/7 Support',   sub: 'Always here' },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{icon}</span>
              <span className="font-semibold text-white text-xs">{title}</span>
              <span className="text-slate-500 text-xs">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <p>© 2024 QenaMarket. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}