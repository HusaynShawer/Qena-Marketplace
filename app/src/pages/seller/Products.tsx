import { Link } from 'react-router-dom'

const SellerProducts = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link to="/seller/products/new" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          + Add Product
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No products yet. Click "Add Product" to get started.</p>
      </div>
    </div>
  )
}

export default SellerProducts