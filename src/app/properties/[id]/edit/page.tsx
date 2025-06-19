'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import PropertyForm from '@/components/PropertyForm'
import { Property, User } from '@/types'
import toast from 'react-hot-toast'

export default function EditPropertyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchUserAndPropertyData()
    } else if (status === 'unauthenticated') {
      setCheckingAccess(false)
    }
  }, [status, params.id])

  const fetchUserAndPropertyData = async () => {
    try {
      // Fetch user data
      const userResponse = await fetch('/api/user/me')
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }
      const userData = await userResponse.json()
      setUser(userData)

      // Fetch property data
      const propertyResponse = await fetch(`/api/properties/${params.id}`)
      if (!propertyResponse.ok) {
        throw new Error('Property not found')
      }
      const propertyData = await propertyResponse.json()
      setProperty(propertyData)

      // Check if user is the owner or has admin role
      const isOwner = propertyData.owner === userData._id || propertyData.owner.email === userData.email
      const isAdmin = userData.role === 'admin'
      
      if (!isOwner && !isAdmin) {
        toast.error('You are not authorized to edit this property')
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load property data')
      router.push('/dashboard')
    } finally {
      setCheckingAccess(false)
    }
  }

  if (status === 'loading' || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
            <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or you don't have permission to edit it.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (propertyData: Partial<Property>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update property')
      }

      toast.success('Property updated successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
            <p className="text-gray-600 mt-2">Update your property listing information.</p>
          </div>

          <PropertyForm 
            onSubmit={handleSubmit} 
            loading={loading}
            initialData={property}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  )
} 