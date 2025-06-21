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

    // Get the property
    const property = await Property.findById(params.id)
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      )
    }

    // Mark all messages from other users as read for this user
    if (property.messages && property.messages.length > 0) {
      property.messages.forEach((message: any) => {
        if (message.sender.toString() !== user._id.toString()) {
          message.isRead = true
        }
      })
      
      await property.save()
    }

    return NextResponse.json({ message: 'Messages marked as read' })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { message: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
} 