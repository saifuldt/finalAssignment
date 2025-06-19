import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const property = await Property.findById(params.id)
      .populate('owner', 'name email')
      .populate('messages.sender', 'name email')

    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { message: 'Failed to fetch property' },
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

    const property = await Property.findById(params.id)
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner or admin
    const user = await User.findOne({ email: session.user.email })
    if (!user || (user.role !== 'admin' && property.owner.toString() !== user._id.toString())) {
      return NextResponse.json(
        { message: 'Unauthorized to update this property' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    const updatedProperty = await Property.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).populate('owner', 'name email')

    return NextResponse.json(updatedProperty)
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { message: 'Failed to update property' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const property = await Property.findById(params.id)
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner or admin
    const user = await User.findOne({ email: session.user.email })
    if (!user || (user.role !== 'admin' && property.owner.toString() !== user._id.toString())) {
      return NextResponse.json(
        { message: 'Unauthorized to delete this property' },
        { status: 403 }
      )
    }

    await Property.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Property deleted successfully' })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { message: 'Failed to delete property' },
      { status: 500 }
    )
  }
} 