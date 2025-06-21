import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { propertyId, message } = await request.json()
    if (!propertyId || !message) {
      return NextResponse.json(
        { message: 'Property ID and message are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    const sender = await User.findOne({ email: session.user.email })
    if (!sender) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Create message in the property's messages array
    property.messages = property.messages || []
    property.messages.push({
      sender: sender._id,
      message,
      createdAt: new Date(),
      isRead: false,
      isDelivered: true,
    })

    await property.save()

    return NextResponse.json({ message: 'Message sent successfully' })
  } catch (error) {
    console.error('Error sending message:', error)
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

    // Get messages for properties owned by the user
    const properties = await Property.find({ owner: user._id })
      .populate('messages.sender', 'name email')
      .select('title messages')
      .lean()

    // Transform messages to include property information
    const messages = properties.flatMap(property => 
      property.messages.map((msg: any) => ({
        ...msg,
        property: {
          _id: property._id,
          title: property.title
        }
      }))
    )

    // Sort by creation date (newest first)
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 