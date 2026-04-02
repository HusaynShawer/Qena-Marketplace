import React, { useState, useEffect } from 'react'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  
  // Login/Register form states
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [message, setMessage] = useState('')

  const API_URL = 'http://localhost:8000'

  // Fetch backend status and products
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('Not connected'))
    
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
  }, [])

  // Fetch user if token exists
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) setUser(data)
        else throw new Error()
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        setToken(null)
      })
    }
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('access_token', data.access_token)
        setToken(data.access_token)
        setMessage('✅ Login successful!')
        setShowLogin(false)
        setLoginEmail('')
        setLoginPassword('')
      } else {
        setMessage('❌ ' + (data.detail || 'Login failed'))
      }
    } catch (err) {
      setMessage('Network error')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: 'buyer' })
      })
      if (res.ok) {
        setMessage('✅ Registration successful! Please login.')
        setShowRegister(false)
        setRegName('')
        setRegEmail('')
        setRegPassword('')
      } else {
        const data = await res.json()
        setMessage('❌ ' + (data.detail || 'Registration failed'))
      }
    } catch (err) {
      setMessage('Network error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
    setMessage('Logged out')
  }

  // Styles
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

  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px'
  }

  return (
    <div style={{ maxWidth: '1200px', margin: 'auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#f97316', textAlign: 'center' }}>🏪 Qena Marketplace</h1>
      
      {/* Backend Status */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        Backend: <strong style={{ color: backendStatus === 'healthy' ? 'green' : 'red' }}>{backendStatus}</strong>
      </div>

      {/* User Info & Actions */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        {user ? (
          <>
            <span>Welcome, <strong>{user.name}</strong> ({user.role}) | </span>
            <button onClick={handleLogout} style={buttonStyle}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => { setShowLogin(true); setShowRegister(false) }} style={buttonStyle}>Login</button>
            <button onClick={() => { setShowRegister(true); setShowLogin(false) }} style={buttonStyle}>Register</button>
          </>
        )}
        <button onClick={() => window.open(`${API_URL}/docs`, '_blank')} style={buttonStyle}>API Docs</button>
      </div>

      {/* Message */}
      {message && <div style={{ textAlign: 'center', padding: '10px', background: '#e8f5e9', borderRadius: '5px', marginBottom: '20px' }}>{message}</div>}

      {/* Login Form */}
      {showLogin && !user && (
        <div style={{ maxWidth: '400px', margin: '0 auto 30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h3>Login</h3>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} required />
            <button type="submit" style={{ ...buttonStyle, width: '100%' }}>Login</button>
          </form>
        </div>
      )}

      {/* Register Form */}
      {showRegister && !user && (
        <div style={{ maxWidth: '400px', margin: '0 auto 30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h3>Register</h3>
          <form onSubmit={handleRegister}>
            <input type="text" placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} style={inputStyle} required />
            <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Password" value={regPassword} onChange={e => setRegPassword(e.target.value)} style={inputStyle} required />
            <button type="submit" style={{ ...buttonStyle, width: '100%' }}>Register</button>
          </form>
        </div>
      )}

      {/* Products */}
      <div>
        <h2>Products ({products.length})</h2>
        {products.length === 0 && <p>No products yet. Login as seller to add.</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {products.map(p => (
            <div key={p.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', width: '200px', textAlign: 'center' }}>
              <strong>{p.name}</strong><br />
              ${p.price}<br />
              <small>Stock: {p.stock}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
