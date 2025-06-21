import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function GET() {
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

    // Get all properties where the user has sent messages
    const properties = await Property.find({
      'messages.sender': user._id
    })
    .populate('messages.sender', 'name email')
    .populate('owner', 'name email')
    .select('title messages owner')
    .lean()

    // Transform messages to include property information
    const messages = properties.flatMap(property => 
      property.messages
        .filter((msg: any) => msg.sender._id.toString() === user._id.toString())
        .map((msg: any) => ({
          ...msg,
          property: {
            _id: property._id,
            title: property.title,
            owner: property.owner
          }
        }))
    )

    // Sort by creation date (newest first)
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching tenant messages:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 