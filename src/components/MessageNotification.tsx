'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface MessageNotificationProps {
  propertyId?: string
}

export default function MessageNotification({ propertyId }: MessageNotificationProps) {
  const { data: session } = useSession()

  // Disabled global notifications - using dedicated notification system instead
  useEffect(() => {
    // Global notifications are disabled
    // Individual property notifications are handled by MessageSystem component
  }, [session, propertyId])

  return null
} 