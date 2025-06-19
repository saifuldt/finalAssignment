import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Property from '@/models/Property'
import User from '@/models/User'

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

    const { propertyId, startDate, endDate, message } = await request.json()

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Property ID, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Get the user making the booking
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Get the property
    const property = await Property.findById(propertyId).populate('owner', 'name email')
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if property is available
    if (property.status !== 'available') {
      return NextResponse.json(
        { message: 'Property is not available for booking' },
        { status: 400 }
      )
    }

    // Check if user is not the owner
    if (property.owner._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { message: 'You cannot book your own property' },
        { status: 400 }
      )
    }

    // Calculate total amount (monthly rate * number of months)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    const totalAmount = property.price * Math.max(1, monthsDiff)

    // Check for existing bookings that overlap
    const existingBooking = await Booking.findOne({
      property: propertyId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    })

    if (existingBooking) {
      return NextResponse.json(
        { message: 'Property is already booked for these dates' },
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await Booking.create({
      property: propertyId,
      tenant: user._id,
      landlord: property.owner._id,
      startDate: start,
      endDate: end,
      totalAmount,
      message: message || '',
    })

    const populatedBooking = await booking.populate([
      { path: 'property', select: 'title price location' },
      { path: 'tenant', select: 'name email' },
      { path: 'landlord', select: 'name email' }
    ])

    return NextResponse.json(populatedBooking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'tenant' or 'landlord'

    let query: any = {}

    if (type === 'tenant') {
      query.tenant = user._id
    } else if (type === 'landlord') {
      query.landlord = user._id
    } else {
      // Return both tenant and landlord bookings
      query.$or = [
        { tenant: user._id },
        { landlord: user._id }
      ]
    }

    const bookings = await Booking.find(query)
      .populate('property', 'title price location images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email')
      .sort({ createdAt: -1 })

    // Transform the data to ensure proper serialization
    const transformedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      property: booking.property ? {
        _id: booking.property._id,
        title: booking.property.title,
        price: booking.property.price,
        location: booking.property.location,
        images: booking.property.images
      } : null,
      tenant: booking.tenant ? {
        _id: booking.tenant._id,
        name: booking.tenant.name,
        email: booking.tenant.email
      } : null,
      landlord: booking.landlord ? {
        _id: booking.landlord._id,
        name: booking.landlord.name,
        email: booking.landlord.email
      } : null
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
} 