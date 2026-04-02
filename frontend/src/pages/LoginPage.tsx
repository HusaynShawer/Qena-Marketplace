import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('access_token', data.access_token)
        navigate('/')
      } else {
        setError(data.detail || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} required />
        <button type="submit" style={{ backgroundColor: '#f97316', color: 'white', padding: '10px', width: '100%', border: 'none', borderRadius: '5px' }}>Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  )
}

export default LoginPage
