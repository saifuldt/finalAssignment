import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthProvider from '@/components/providers/AuthProvider'
import Navbar from '@/components/layout/Navbar'
import MessageNotification from '@/components/MessageNotification'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'RentNest - Find Your Perfect Home',
  description: 'Discover and rent the perfect property with RentNest - Your trusted platform for house and apartment rentals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <Navbar />
          {children}
          <MessageNotification />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  )
} 