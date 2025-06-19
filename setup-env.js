#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupEnvironment() {
  console.log('🚀 RentNest Environment Setup\n')
  console.log('This script will help you create a .env.local file with the required environment variables.\n')

  const envPath = path.join(process.cwd(), '.env.local')
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('A .env.local file already exists. Do you want to overwrite it? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('\n📋 Required Environment Variables:\n')

  // Database
  const mongodbUri = await question('MongoDB URI (e.g., mongodb://localhost:27017/rentnest): ')
  
  // NextAuth
  const nextAuthUrl = await question('NextAuth URL (default: http://localhost:3000): ') || 'http://localhost:3000'
  const nextAuthSecret = await question('NextAuth Secret (generate a random string): ')
  
  // Cloudinary
  console.log('\n🌤️  Cloudinary Configuration (Required for image uploads):')
  console.log('Sign up at https://cloudinary.com/ and get your credentials from the dashboard.\n')
  
  const cloudinaryCloudName = await question('Cloudinary Cloud Name: ')
  const cloudinaryApiKey = await question('Cloudinary API Key: ')
  const cloudinaryApiSecret = await question('Cloudinary API Secret: ')

  // Generate .env.local content
  let envContent = `# Database
MONGODB_URI=${mongodbUri}

# NextAuth
NEXTAUTH_URL=${nextAuthUrl}
NEXTAUTH_SECRET=${nextAuthSecret}

# Cloudinary (Required for image uploads)
CLOUDINARY_CLOUD_NAME=${cloudinaryCloudName}
CLOUDINARY_API_KEY=${cloudinaryApiKey}
CLOUDINARY_API_SECRET=${cloudinaryApiSecret}
`

  // Write to file
  fs.writeFileSync(envPath, envContent)

  console.log('\n✅ Environment file created successfully!')
  console.log(`📁 File location: ${envPath}`)
  console.log('\n🔧 Next steps:')
  console.log('1. Install dependencies: npm install')
  console.log('2. Start the development server: npm run dev')
  console.log('3. Open http://localhost:3000 in your browser')
  console.log('\n⚠️  Important:')
  console.log('- Make sure your MongoDB instance is running')
  console.log('- Verify your Cloudinary credentials are correct')
  console.log('- Keep your .env.local file secure and never commit it to version control')

  rl.close()
}

setupEnvironment().catch(console.error) 