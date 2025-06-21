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
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const property = await Property.findById(params.id)
      .populate('messages.sender', 'name email')
      .populate('owner', 'name email')

    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    // Transform messages to ensure proper serialization
    const transformedMessages = property.messages.map((msg: any) => ({
      _id: msg._id,
      message: msg.message,
      createdAt: msg.createdAt,
      isRead: msg.isRead || false,
      isDelivered: msg.isDelivered !== false, // Default to true
      sender: msg.sender ? {
        _id: msg.sender._id,
        name: msg.sender.name,
        email: msg.sender.email
      } : null
    }))

    return NextResponse.json({
      messages: transformedMessages,
      property: {
        _id: property._id,
        title: property.title,
        owner: property.owner ? {
          _id: property.owner._id,
          name: property.owner.name,
          email: property.owner.email
        } : null
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { message: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const { message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      )
    }

    // Get the user sending the message
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Get the property
    const property = await Property.findById(params.id)
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    // Add message to property
    property.messages.push({
      sender: user._id,
      message: message.trim(),
      createdAt: new Date(),
      isRead: false,
      isDelivered: true,
    })

    await property.save()

    return NextResponse.json({ message: 'Message sent successfully' })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    )
  }
} 