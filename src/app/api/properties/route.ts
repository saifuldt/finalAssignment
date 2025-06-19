import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'
import Booking from '@/models/Booking'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const stats = searchParams.get('stats')

    // Only require session for stats or owner queries
    let session = null
    let user = null
    if (stats === 'true' || owner === 'true') {
      session = await getServerSession()
      if (!session?.user) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        )
      }
      // Get user data
      user = await User.findOne({ email: session.user.email })
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }
    }

    // If requesting stats, return dashboard statistics
    if (stats === 'true') {
      if (user.role === 'landlord') {
        // Landlord stats
        const totalProperties = await Property.countDocuments({ owner: user._id })
        const availableProperties = await Property.countDocuments({ 
          owner: user._id, 
          status: 'available' 
        })
        const rentedProperties = await Property.countDocuments({ 
          owner: user._id, 
          status: 'rented' 
        })
        
        // Booking stats for landlord
        const pendingBookings = await Booking.countDocuments({ 
          landlord: user._id, 
          status: 'pending' 
        })
        const totalBookings = await Booking.countDocuments({ landlord: user._id })
        
        // Calculate monthly revenue (sum of approved bookings)
        const approvedBookings = await Booking.find({ 
          landlord: user._id, 
          status: 'approved' 
        })
        const monthlyRevenue = approvedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)

        return NextResponse.json({
          totalProperties,
          availableProperties,
          rentedProperties,
          pendingBookings,
          totalBookings,
          monthlyRevenue,
          totalMessages: 0, // TODO: Implement message counting
          totalFavorites: 0,
          savedProperties: 0,
          recentViews: 0
        })
      } else {
        // User stats
        const savedProperties = user.favorites ? user.favorites.length : 0
        const totalBookings = await Booking.countDocuments({ tenant: user._id })
        const pendingBookings = await Booking.countDocuments({ 
          tenant: user._id, 
          status: 'pending' 
        })

        return NextResponse.json({
          totalProperties: 0,
          availableProperties: 0,
          rentedProperties: 0,
          pendingBookings,
          totalBookings,
          monthlyRevenue: 0,
          totalMessages: 0, // TODO: Implement message counting
          totalFavorites: 0,
          savedProperties,
          recentViews: 0
        })
      }
    }

    // If requesting owner's properties
    if (owner === 'true') {
      const properties = await Property.find({ owner: user._id })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })

      // Transform the data to ensure proper serialization
      const transformedProperties = properties.map(property => ({
        ...property.toObject(),
        owner: property.owner ? {
          _id: property.owner._id,
          name: property.owner.name,
          email: property.owner.email
        } : null
      }))

      return NextResponse.json(transformedProperties)
    }

    // Get all properties with filters (public, no auth required)
    const type = searchParams.get('type')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')
    const status = searchParams.get('status')

    let query: any = {}

    if (type) query.type = type
    if (status) query.status = status
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseInt(minPrice)
      if (maxPrice) query.price.$lte = parseInt(maxPrice)
    }
    if (bedrooms) query['features.bedrooms'] = { $gte: parseInt(bedrooms) }
    if (bathrooms) query['features.bathrooms'] = { $gte: parseInt(bathrooms) }

    const properties = await Property.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })

    // Transform the data to ensure proper serialization
    const transformedProperties = properties.map(property => ({
      ...property.toObject(),
      owner: property.owner ? {
        _id: property.owner._id,
        name: property.owner.name,
        email: property.owner.email
      } : null
    }))

    return NextResponse.json(transformedProperties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is a landlord
    if (user.role !== 'landlord') {
      return NextResponse.json(
        { message: 'Only landlords can add properties' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      price,
      location,
      features,
      images,
      status = 'available'
    } = body

    // Validate required fields
    if (!title || !description || !type || !price || !location || !features) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const property = await Property.create({
      title,
      description,
      type,
      price: parseInt(price),
      location,
      features: {
        bedrooms: parseInt(features.bedrooms),
        bathrooms: parseInt(features.bathrooms),
        area: parseInt(features.area),
        parking: features.parking || false,
        furnished: features.furnished || false,
      },
      images: images || [],
      owner: user._id,
      status,
    })

    const populatedProperty = await property.populate('owner', 'name email')

    return NextResponse.json(populatedProperty, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 