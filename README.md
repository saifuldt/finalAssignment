# RentNest - Property Rental Platform

A modern property rental platform built with Next.js, TypeScript, and MongoDB.

## Features

- User authentication and authorization
- Property listing and management
- Image upload and storage
- Property search and filtering
- Messaging system
- Favorites system

## Prerequisites

- Node.js 18+ 
- MongoDB database
- Cloudinary account (for image uploads)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rentnest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string_here

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here

   # Cloudinary (Required for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Cloudinary Setup**
   - Sign up at [Cloudinary](https://cloudinary.com/)
   - Get your Cloud Name, API Key, and API Secret from your dashboard
   - Add them to your `.env.local` file

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Image Upload Issues

If images are not uploading or displaying:

1. **Check Cloudinary Configuration**
   - Ensure all Cloudinary environment variables are set correctly
   - Verify your Cloudinary account is active
   - Check that your API key has upload permissions

2. **Check Browser Console**
   - Open browser developer tools
   - Look for any JavaScript errors
   - Check the Network tab for failed requests

3. **Check Server Logs**
   - Look at the terminal where you're running `npm run dev`
   - Check for any error messages related to image uploads

4. **File Size and Type**
   - Images must be less than 10MB
   - Only image files (JPG, PNG, GIF) are supported

## Troubleshooting

### Images not uploading
- Verify Cloudinary environment variables are set
- Check browser console for errors
- Ensure file size is under 10MB
- Verify file type is an image

### Images not displaying
- Check if the image URLs are valid
- Verify the images were uploaded successfully to Cloudinary
- Check browser network tab for failed image requests

### Form styling issues
- Ensure all CSS classes are properly defined
- Check that Tailwind CSS is working correctly

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Image Storage**: Cloudinary
- **State Management**: React hooks

## License

MIT 