import React, { useState, useEffect } from 'react'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('Not connected'))

    fetch('http://localhost:8000/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#f97316' }}>🏪 Qena Marketplace</h1>
      
      <div style={{ margin: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>Backend Status:</h3>
        <p style={{ color: backendStatus === 'healthy' ? 'green' : 'red', fontWeight: 'bold' }}>
          {backendStatus}
        </p>
      </div>

      <div style={{ margin: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>Quick Actions:</h3>
        <button onClick={() => window.open('http://localhost:8000/docs', '_blank')} style={buttonStyle}>
          View API Docs
        </button>
        <button onClick={() => window.location.href = '/login'} style={buttonStyle}>
          Login
        </button>
        <button onClick={() => window.location.href = '/register'} style={buttonStyle}>
          Register
        </button>
      </div>

      <div>
        <h3>Products ({products.length})</h3>
        {products.length === 0 ? (
          <p>No products yet. Login as a seller to add products!</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            {products.map(product => (
              <div key={product.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', width: '200px' }}>
                <h4>{product.name}</h4>
                <p>${product.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const buttonStyle = {
  backgroundColor: '#f97316',
  color: 'white',
  padding: '10px 20px',
  margin: '10px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px'
}

export default App
