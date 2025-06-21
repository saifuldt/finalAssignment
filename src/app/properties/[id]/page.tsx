'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Property, User } from '@/types'
import toast from 'react-hot-toast'
import { HeartIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import Link from 'next/link'
import BookingForm from '@/components/BookingForm'
import MessageSystem from '@/components/MessageSystem'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [property, setProperty] = useState<Property | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    if (params && params.id) {
      fetchProperty()
    }
    if (session?.user) {
      fetchUserData()
    }
  }, [params, session])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${params && params.id}`)
      if (!response.ok) {
        throw new Error('Property not found')
      }
      const data = await response.json()
      setProperty(data)
    } catch (error) {
      console.error('Error fetching property:', error)
      toast.error('Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        
        // Check if property is in user's favorites
        if (userData.favorites && property) {
          setIsFavorite(userData.favorites.includes(property._id))
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleToggleFavorite = async () => {
    if (!session?.user) {
      toast.error('Please sign in to save favorites')
      return
    }

    if (!property) return

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId: property._id }),
      })

      if (!response.ok) throw new Error('Failed to update favorite')

      const { isFavorite: newFavoriteState } = await response.json()
      setIsFavorite(newFavoriteState)

      toast.success(
        newFavoriteState ? 'Added to favorites' : 'Removed from favorites'
      )
    } catch (error) {
      toast.error('Failed to update favorite')
    }
  }

  const handleDeleteProperty = async () => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${property?._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Property deleted successfully')
        router.push('/dashboard')
      } else {
        throw new Error('Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    }
  }

  const handleBookingSuccess = () => {
    setShowBookingForm(false)
    toast.success('Booking request sent! The landlord will review your request.')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading property...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Property not found</div>
      </div>
    )
  }

  const isOwner = Boolean(session?.user?.email && (
    typeof property.owner === 'string' 
      ? property.owner === session.user.email
      : property.owner.email === session.user.email
  ))
  const isLandlord = user?.role === 'landlord'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Property Images */}
          <div className="h-96 bg-gray-200 relative">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = 'flex'
                  }
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center text-gray-400"
              style={{ display: property.images && property.images.length > 0 ? 'none' : 'flex' }}
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No Image Available</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {!isOwner && session && (
                <button
                  onClick={handleToggleFavorite}
                  className="p-3 rounded-full bg-white/80 hover:bg-white shadow-sm"
                >
                  {isFavorite ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-600" />
                  )}
                </button>
              )}
              
              {isOwner && isLandlord && (
                <>
                  <Link
                    href={`/properties/${property._id}/edit`}
                    className="p-3 rounded-full bg-white/80 hover:bg-white shadow-sm"
                  >
                    <PencilIcon className="h-6 w-6 text-blue-600" />
                  </Link>
                  <button
                    onClick={handleDeleteProperty}
                    className="p-3 rounded-full bg-white/80 hover:bg-white shadow-sm"
                  >
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </button>
                </>
              )}
            </div>
            
            <div className="absolute bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-lg font-semibold">
              ${property.price}/month
            </div>
          </div>

          <div className="p-8">
            {/* Property Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <p className="text-gray-600 text-lg">{property.location.address}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{property.features.bedrooms} bed</span>
                <span>•</span>
                <span>{property.features.bathrooms} bath</span>
                <span>•</span>
                <span className="capitalize">{property.type}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Property Details */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 mb-8">{property.description}</p>

                <h2 className="text-2xl font-semibold mb-4">Features</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Bedrooms:</span>
                    <span className="font-semibold">{property.features.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Bathrooms:</span>
                    <span className="font-semibold">{property.features.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-semibold">{property.features.area} sq ft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Parking:</span>
                    <span className="font-semibold">{property.features.parking ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Furnished:</span>
                    <span className="font-semibold">{property.features.furnished ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Form or Booking Form */}
              <div className="lg:col-span-1 ">
                {isOwner ? (
                  <div className="bg-gray-50 p-8 rounded-lg">
                    <h2 className="text-xl font-semibold pb-4">Property Management</h2>
                    <div className="flex flex-col gap-2">
                      <p className="text-gray-600">You own this property. Manage it from your dashboard.</p>
                      <Link href="/dashboard" className="btn-primary w-full text-center mt-4">
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                ) : showBookingForm ? (
                  <BookingForm 
                    property={property}
                    onSuccess={handleBookingSuccess}
                    onCancel={() => setShowBookingForm(false)}
                  />
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      {session?.user ? 'Contact Landlord' : 'Sign in to Contact'}
                    </h2>
                    
                    {session?.user ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-gray-600 mb-4">
                            {user?.role !== 'landlord' 
                              ? 'Contact the landlord or book this property through your dashboard.'
                              : 'Manage this property through your dashboard.'
                            }
                          </p>
                          <Link href="/dashboard" className="btn-primary w-full">
                            Go to Dashboard
                          </Link>
                        </div>
                        
                        {user?.role !== 'landlord' && (
                          <div className="border-t pt-4">
                            <button
                              onClick={() => setShowBookingForm(true)}
                              className="btn-secondary w-full flex items-center justify-center gap-2"
                            >
                              <CalendarIcon className="h-5 w-5" />
                              Book This Property
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">Sign in to contact the landlord or book this property</p>
                        <button
                          onClick={() => router.push('/auth/signin')}
                          className="btn-primary w-full"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Message System */}
      {session?.user && property?._id && (
        <MessageSystem
          propertyId={property._id}
          propertyTitle={property.title}
          isOwner={isOwner}
        />
      )}
    </div>
  )
} 