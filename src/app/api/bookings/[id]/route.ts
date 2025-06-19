import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const booking = await Booking.findById(params.id)
      .populate('property', 'title price location images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email')

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized to view this booking
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (booking.tenant._id.toString() !== user._id.toString() && 
        booking.landlord._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: 'Unauthorized to view this booking' },
        { status: 403 }
      )
    }

    // Transform the data to ensure proper serialization
    const transformedBooking = {
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
    }

    return NextResponse.json(transformedBooking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { message: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { action } = await request.json() // 'approve', 'reject', 'cancel'

    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(params.id)
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      )
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check authorization based on action
    if (action === 'cancel') {
      // Only tenant can cancel
      if (booking.tenant.toString() !== user._id.toString()) {
        return NextResponse.json(
          { message: 'Only the tenant can cancel a booking' },
          { status: 403 }
        )
      }
    } else {
      // Only landlord can approve/reject
      if (booking.landlord.toString() !== user._id.toString()) {
        return NextResponse.json(
          { message: 'Only the landlord can approve or reject a booking' },
          { status: 403 }
        )
      }
    }

    // Update booking status
    let newStatus = ''
    switch (action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'cancel':
        newStatus = 'cancelled'
        break
    }

    booking.status = newStatus
    booking.updatedAt = new Date()
    await booking.save()

    const populatedBooking = await booking.populate([
      { path: 'property', select: 'title price location' },
      { path: 'tenant', select: 'name email' },
      { path: 'landlord', select: 'name email' }
    ])

    return NextResponse.json(populatedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { message: 'Failed to update booking' },
      { status: 500 }
    )
  }
} 