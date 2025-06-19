'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { HeartIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { User } from '@/types'

interface Property {
  _id: string
  title: string
  description: string
  price: number
  type: string
  location: {
    city: string
    state: string
  }
  features: {
    bedrooms: number
    bathrooms: number
    area: number
  }
  images: string[]
  owner: string
}

export default function PropertyList() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchProperties()
    if (session?.user) {
      fetchUserData()
    }
  }, [searchParams, session])

  async function fetchProperties() {
    try {
      const queryString = searchParams.toString()
      const response = await fetch(`/api/properties?${queryString}`)
      const data = await response.json()
      setProperties(data.properties)
    } catch (error) {
      toast.error('Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUserData() {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  async function toggleFavorite(propertyId: string) {
    if (!session) {
      toast.error('Please sign in to save favorites')
      return
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      })

      if (!response.ok) throw new Error('Failed to update favorite')

      const { isFavorite } = await response.json()
      setFavorites((prev) =>
        isFavorite
          ? [...prev, propertyId]
          : prev.filter((id) => id !== propertyId)
      )

      toast.success(
        isFavorite ? 'Added to favorites' : 'Removed from favorites'
      )
    } catch (error) {
      toast.error('Failed to update favorite')
    }
  }

  async function handleDeleteProperty(propertyId: string) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Property deleted successfully')
        fetchProperties()
      } else {
        throw new Error('Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    }
  }

  const isLandlord = user?.role === 'landlord'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
        <p className="mt-2 text-gray-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => {
        const isOwner = session?.user?.email && property.owner === session.user.email
        
        return (
          <div key={property._id} className="card group">
            <Link href={`/properties/${property._id}`}>
              <div className="relative h-48">
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
                  className="w-full h-full flex items-center justify-center bg-gray-100"
                  style={{ display: property.images && property.images.length > 0 ? 'none' : 'flex' }}
                >
                  <div className="text-center text-gray-400">
                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">No Image</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {!isOwner && session && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleFavorite(property._id)
                      }}
                      className="p-2 rounded-full bg-white/80 hover:bg-white"
                    >
                      {favorites.includes(property._id) ? (
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
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full bg-white/80 hover:bg-white"
                      >
                        <PencilIcon className="h-6 w-6 text-blue-600" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteProperty(property._id)
                        }}
                        className="p-2 rounded-full bg-white/80 hover:bg-white"
                      >
                        <TrashIcon className="h-6 w-6 text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600">
                  {property.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {property.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary-600">
                    ${property.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </span>
                  <div className="text-sm text-gray-500">
                    {property.location.city}, {property.location.state}
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-gray-500">
                  <span>{property.features.bedrooms} beds</span>
                  <span>{property.features.bathrooms} baths</span>
                  <span>{property.features.area} sqft</span>
                </div>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
} 