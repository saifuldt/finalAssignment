'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Property, User, Booking } from '@/types'
import toast from 'react-hot-toast'
import { 
  HomeIcon, 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  StarIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalProperties: number
  availableProperties: number
  rentedProperties: number
  totalMessages: number
  totalFavorites: number
  monthlyRevenue: number
  savedProperties: number
  recentViews: number
  pendingBookings: number
  totalBookings: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    totalMessages: 0,
    totalFavorites: 0,
    monthlyRevenue: 0,
    savedProperties: 0,
    recentViews: 0
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      // Fetch user data first
      const userResponse = await fetch('/api/user/me')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
        
        if (userData.role === 'landlord') {
          // Fetch landlord-specific data
          await fetchLandlordData()
        } else {
          // Fetch user-specific data
          await fetchUserData()
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLandlordData = async () => {
    try {
      // Fetch user properties
      const propertiesResponse = await fetch('/api/properties?owner=me')
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        setProperties(propertiesData)
        
        // Calculate stats
        const totalProperties = propertiesData.length
        const availableProperties = propertiesData.filter((p: Property) => p.status === 'available').length
        const rentedProperties = propertiesData.filter((p: Property) => p.status === 'rented').length
        const totalMessages = propertiesData.reduce((acc: number, p: Property) => acc + (p.messages?.length || 0), 0)
        const monthlyRevenue = propertiesData
          .filter((p: Property) => p.status === 'rented')
          .reduce((acc: number, p: Property) => acc + p.price, 0)
        
        setStats({
          totalProperties,
          availableProperties,
          rentedProperties,
          totalMessages,
          totalFavorites: 0,
          monthlyRevenue,
          savedProperties: 0,
          recentViews: 0
        })
      }
    } catch (error) {
      console.error('Error fetching landlord data:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      // Fetch user's favorite properties
      const favoritesResponse = await fetch('/api/favorites')
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json()
        setFavoriteProperties(favoritesData)
        
        setStats({
          totalProperties: 0,
          availableProperties: 0,
          rentedProperties: 0,
          totalMessages: 0,
          totalFavorites: favoritesData.length,
          monthlyRevenue: 0,
          savedProperties: favoritesData.length,
          recentViews: 0
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Property deleted successfully')
        fetchDashboardData()
      } else {
        throw new Error('Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    }
  }

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/favorites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      })

      if (response.ok) {
        toast.success('Removed from favorites')
        fetchDashboardData()
      } else {
        throw new Error('Failed to remove from favorites')
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      toast.error('Failed to remove from favorites')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const isLandlord = user?.role === 'landlord'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isLandlord ? 'Landlord Dashboard' : 'My Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {session?.user?.name}! 
                {isLandlord 
                  ? ' Manage your properties and track your rental business.'
                  : ' Track your favorite properties and rental activities.'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <UserIcon className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 capitalize">{user?.role}</span>
              </div>
              {isLandlord && (
                <Link
                  href="/properties/new"
                  className="btn-primary flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Property
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: HomeIcon },
              { id: 'properties', label: isLandlord ? 'My Properties' : 'Saved Properties', icon: isLandlord ? BuildingOfficeIcon : HeartIcon },
              { id: 'messages', label: 'Messages', icon: ChatBubbleLeftIcon },
              { id: 'favorites', label: isLandlord ? 'Favorites' : 'Recent Views', icon: isLandlord ? HeartIcon : ClockIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLandlord ? (
                // Landlord Stats
                <>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Properties</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Available</p>
                        <p className="text-3xl font-bold text-green-600">{stats.availableProperties}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <HomeIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Rented</p>
                        <p className="text-3xl font-bold text-purple-600">{stats.rentedProperties}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-green-600">${stats.monthlyRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // User Stats
                <>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Saved Properties</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.savedProperties}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <HeartIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recent Views</p>
                        <p className="text-3xl font-bold text-green-600">{stats.recentViews}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <EyeIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Messages</p>
                        <p className="text-3xl font-bold text-purple-600">{stats.totalMessages}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <ChatBubbleLeftIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Searches</p>
                        <p className="text-3xl font-bold text-green-600">3</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <StarIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isLandlord ? (
                    <>
                      <Link
                        href="/properties/new"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <PlusIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Add New Property</p>
                          <p className="text-sm text-gray-600">List a new property for rent</p>
                        </div>
                      </Link>
                      
                      <Link
                        href="/properties"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <EyeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Manage Properties</p>
                          <p className="text-sm text-gray-600">View and edit your listings</p>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/properties"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <EyeIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Browse Properties</p>
                          <p className="text-sm text-gray-600">Find your perfect rental</p>
                        </div>
                      </Link>
                      
                      <Link
                        href="/dashboard?tab=favorites"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <div className="p-2 bg-red-100 rounded-lg">
                          <HeartIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">View Favorites</p>
                          <p className="text-sm text-gray-600">Check your saved properties</p>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {isLandlord ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ChatBubbleLeftIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stats.totalMessages} New Messages</p>
                          <p className="text-sm text-gray-600">From potential tenants</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <HeartIcon className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stats.totalFavorites} Favorites</p>
                          <p className="text-sm text-gray-600">Properties saved by users</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <HeartIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stats.savedProperties} Saved Properties</p>
                          <p className="text-sm text-gray-600">Properties you've favorited</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <EyeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stats.recentViews} Recent Views</p>
                          <p className="text-sm text-gray-600">Properties you've viewed</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            ) : isLandlord ? (
              // Landlord Properties View
              properties.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h3>
                  <p className="text-gray-600 mb-6">Start building your rental portfolio by adding your first property.</p>
                  <Link href="/properties/new" className="btn-primary">
                    Add Your First Property
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property) => (
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

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Link
                            href={`/properties/${property._id}`}
                            className="flex-1 btn-secondary text-center text-sm"
                          >
                            <EyeIcon className="h-4 w-4 inline mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/properties/${property._id}/edit`}
                            className="flex-1 btn-secondary text-center text-sm"
                          >
                            <PencilIcon className="h-4 w-4 inline mr-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteProperty(property._id!)}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // User Saved Properties View
              favoriteProperties.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <HeartIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Properties</h3>
                  <p className="text-gray-600 mb-6">Start exploring properties and save your favorites for easy access.</p>
                  <Link href="/properties" className="btn-primary">
                    Browse Properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {favoriteProperties.map((property) => (
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

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Link
                            href={`/properties/${property._id}`}
                            className="flex-1 btn-secondary text-center text-sm"
                          >
                            <EyeIcon className="h-4 w-4 inline mr-1" />
                            View Details
                          </Link>
                          <button
                            onClick={() => handleRemoveFavorite(property._id!)}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Messages</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages Feature</h3>
                <p className="text-gray-600 mb-6">
                  {isLandlord 
                    ? 'View and respond to messages from potential tenants about your properties.'
                    : 'View messages from landlords about your property inquiries and bookings.'
                  }
                </p>
                <p className="text-gray-500 text-sm">Messages functionality will be available soon!</p>
              </div>
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isLandlord ? 'Favorites' : 'Recent Views'}
            </h3>
            <div className="text-center py-8">
              {isLandlord ? (
                <>
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Favorites feature coming soon!</p>
                </>
              ) : (
                <>
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Recent views feature coming soon!</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 