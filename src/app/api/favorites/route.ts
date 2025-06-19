import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Property from '@/models/Property'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { propertyId } = await request.json()
    if (!propertyId) {
      return NextResponse.json(
        { message: 'Property ID is required' },
        { status: 400 }
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

    const favorites = user.favorites || []
    const isFavorite = favorites.includes(propertyId)

    if (isFavorite) {
      user.favorites = favorites.filter((id: string) => id !== propertyId)
    } else {
      user.favorites = [...favorites, propertyId]
    }

    await user.save()

    return NextResponse.json({ isFavorite: !isFavorite })
  } catch (error) {
    console.error('Error updating favorites:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
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

    // Fetch the actual property objects with proper owner handling
    const favoriteProperties = await Property.find({
      _id: { $in: user.favorites || [] }
    }).populate('owner', 'name email')

    // Transform the data to ensure owner is properly serialized
    const transformedProperties = favoriteProperties.map(property => ({
      ...property.toObject(),
      owner: property.owner ? {
        _id: property.owner._id,
        name: property.owner.name,
        email: property.owner.email
      } : null
    }))

    return NextResponse.json(transformedProperties)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { propertyId } = await request.json()
    if (!propertyId) {
      return NextResponse.json(
        { message: 'Property ID is required' },
        { status: 400 }
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

    // Remove the property from favorites
    user.favorites = (user.favorites || []).filter((id: string) => id !== propertyId)
    await user.save()

    return NextResponse.json({ message: 'Removed from favorites' })
  } catch (error) {
    console.error('Error removing from favorites:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 