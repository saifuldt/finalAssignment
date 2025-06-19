import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Check if Cloudinary environment variables are configured
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary environment variables are not configured')
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
})

export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Image upload service is not configured' }, 
        { status: 500 }
      )
    }

    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate that the image is a base64 string
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'rentnest',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid api_key')) {
        return NextResponse.json({ error: 'Invalid Cloudinary configuration' }, { status: 500 })
      }
      if (error.message.includes('File size too large')) {
        return NextResponse.json({ error: 'Image file is too large' }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
} 