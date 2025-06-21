import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

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

    // Get the user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Find the property that contains this message
    const property = await Property.findOne({
      'messages._id': params.id
    })

    if (!property) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      )
    }

    // Find and mark the specific message as read
    const messageIndex = property.messages.findIndex(
      (msg: any) => msg._id.toString() === params.id
    )

    if (messageIndex === -1) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      )
    }

    // Only mark as read if the message is not from the current user
    if (property.messages[messageIndex].sender.toString() !== user._id.toString()) {
      property.messages[messageIndex].isRead = true
      await property.save()
    }

    return NextResponse.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Error marking message as read:', error)
    return NextResponse.json(
      { message: 'Failed to mark message as read' },
      { status: 500 }
    )
  }
} 