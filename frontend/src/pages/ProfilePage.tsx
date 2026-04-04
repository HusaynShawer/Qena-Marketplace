import React from 'react'
import { useAuth } from '../context/AuthContext'

const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="font-semibold">Name:</label>
            <p>{user?.name}</p>
          </div>
          <div>
            <label className="font-semibold">Email:</label>
            <p>{user?.email}</p>
          </div>
          <div>
            <label className="font-semibold">Role:</label>
            <p className="capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage