'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { User, Property } from '@/types'
import { MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
    }
    fetchProperties()
  }, [session])

  const fetchUserData = async () => {
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

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const propertiesData = await response.json()
        setProperties(propertiesData)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const isLandlord = user?.role === 'landlord'

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect Home
            </h1>
            <p className="text-xl mb-8">
              Discover the best rental properties in your area. From cozy apartments to spacious houses, we've got you covered.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/properties" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                Browse Properties
              </Link>
              {isLandlord && (
                <Link href="/properties/new" className="btn-secondary bg-primary-700 text-white hover:bg-primary-800">
                  List Your Property
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All Properties Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Available Properties</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-xl">Loading properties...</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Available</h3>
              <p className="text-gray-600">Check back later for new listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.slice(0, 6).map((property) => (
                <div key={property._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Property Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className="hidden absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : property.status === 'rented'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <span className="text-lg font-bold text-gray-900">${property.price}</span>
                      <span className="text-sm text-gray-600">/mo</span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                    <p className="text-gray-600 mb-3 flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {property.location.city}, {property.location.state}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>{property.features.bedrooms} bed</span>
                      <span>•</span>
                      <span>{property.features.bathrooms} bath</span>
                      <span>•</span>
                      <span className="capitalize">{property.type}</span>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/properties/${property._id}`}
                      className="btn-primary w-full text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {properties.length > 6 && (
            <div className="text-center mt-8">
              <Link href="/properties" className="btn-secondary">
                View All Properties
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
} 