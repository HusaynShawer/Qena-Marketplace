import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import SellerProducts from './pages/seller/SellerProducts'
import EditProduct from './pages/seller/EditProduct'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected seller routes */}
        <Route element={<PrivateRoute allowedRoles={['seller']} />}>
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/products/edit/:id" element={<EditProduct />} />
          <Route path="/seller/products/new" element={<NewProduct />} />
        </Route>

        {/* Admin routes */}
        <Route element={<PrivateRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App