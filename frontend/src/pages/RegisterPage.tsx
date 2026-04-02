import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'buyer' })
      })
      if (res.ok) {
        navigate('/login')
      } else {
        const data = await res.json()
        setError(data.detail || 'Registration failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} required />
        <button type="submit" style={{ backgroundColor: '#4caf50', color: 'white', padding: '10px', width: '100%', border: 'none', borderRadius: '5px' }}>Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

export default RegisterPage
