'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Message, User, Property } from '@/types'
import toast from 'react-hot-toast'
import { 
  ChatBubbleLeftIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  EyeIcon,
  BuildingOfficeIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MessageWithProperty extends Message {
  sender: User
  property: Property
  isRead?: boolean
  isDelivered?: boolean
}

interface MessagesDashboardProps {
  isLandlord: boolean
}

export default function MessagesDashboard({ isLandlord }: MessagesDashboardProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<MessageWithProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [showChatBox, setShowChatBox] = useState(false)
  const [selectedPropertyForChat, setSelectedPropertyForChat] = useState<Property | null>(null)

  // Fetch messages based on user role
  const fetchMessages = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      const endpoint = isLandlord ? '/api/messages' : '/api/messages/tenant'
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ))
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Open chat for a specific property
  const openChatForProperty = (property: Property) => {
    setSelectedPropertyForChat(property)
    setShowChatBox(true)
  }

  // Group messages by property
  const groupMessagesByProperty = () => {
    const grouped: { [key: string]: MessageWithProperty[] } = {}
    
    messages.forEach(message => {
      const propertyId = typeof message.property === 'string' 
        ? message.property 
        : message.property._id!
      
      if (!grouped[propertyId]) {
        grouped[propertyId] = []
      }
      grouped[propertyId].push(message)
    })
    
    return grouped
  }

  // Filter messages
  const getFilteredMessages = () => {
    let filtered = messages
    
    if (filter === 'unread') {
      filtered = filtered.filter(msg => !msg.isRead)
    } else if (filter === 'read') {
      filtered = filtered.filter(msg => msg.isRead)
    }
    
    if (selectedProperty) {
      filtered = filtered.filter(msg => {
        const propertyId = typeof msg.property === 'string' 
          ? msg.property 
          : msg.property._id!
        return propertyId === selectedProperty
      })
    }
    
    return filtered
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString()
    }
  }

  // Check if message is from current user
  const isOwnMessage = (message: MessageWithProperty) => {
    return message.sender?.email === session?.user?.email
  }

  // Get property title
  const getPropertyTitle = (message: MessageWithProperty) => {
    return typeof message.property === 'string' 
      ? 'Property' 
      : message.property?.title || 'Property'
  }

  // Get property ID
  const getPropertyId = (message: MessageWithProperty) => {
    return typeof message.property === 'string' 
      ? message.property 
      : message.property?._id || ''
  }

  // Get property object
  const getPropertyObject = (message: MessageWithProperty) => {
    return typeof message.property === 'string' 
      ? null 
      : message.property
  }

  useEffect(() => {
    if (session?.user) {
      fetchMessages()
    }
  }, [session, isLandlord])

  // Auto-refresh messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, 30000)

    return () => clearInterval(interval)
  }, [isLandlord])

  const filteredMessages = getFilteredMessages()
  const groupedMessages = groupMessagesByProperty()
  const unreadCount = messages.filter(msg => !isOwnMessage(msg) && !msg.isRead).length

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Messages</h3>
          <p className="text-sm text-gray-600">
            {isLandlord 
              ? 'Messages from potential tenants about your properties'
              : 'Messages from landlords about your inquiries'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <BellIcon className="h-4 w-4" />
              <span>{unreadCount} unread</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Messages</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        
        {Object.keys(groupedMessages).length > 1 && (
          <select
            value={selectedProperty || ''}
            onChange={(e) => setSelectedProperty(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Properties</option>
            {Object.keys(groupedMessages).map(propertyId => {
              const propertyMessages = groupedMessages[propertyId]
              const property = propertyMessages[0].property
              const title = typeof property === 'string' ? 'Property' : property.title
              return (
                <option key={propertyId} value={propertyId}>
                  {title}
                </option>
              )
            })}
          </select>
        )}
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'You don\'t have any messages yet.'
                : `No ${filter} messages found.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message._id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !isOwnMessage(message) && !message.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!isOwnMessage(message) && !message.isRead) {
                    markAsRead(message._id!)
                  }
                  // Open chat for this property
                  const property = getPropertyObject(message)
                  if (property) {
                    openChatForProperty(property)
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {isOwnMessage(message) ? 'You' : message.sender?.name || 'Unknown'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                        {!isOwnMessage(message) && !message.isRead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      
                      {/* Message Status */}
                      {isOwnMessage(message) && (
                        <div className="flex items-center gap-1">
                          {message.isRead ? (
                            <CheckIcon className="h-4 w-4 text-blue-500" />
                          ) : message.isDelivered ? (
                            <CheckIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-2 line-clamp-2">
                      {message.message}
                    </p>
                    
                    {/* Property Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{getPropertyTitle(message)}</span>
                      <Link
                        href={`/properties/${getPropertyId(message)}`}
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EyeIcon className="h-3 w-3" />
                        View Property
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Box Modal */}
      {showChatBox && selectedPropertyForChat && (
        <div className="fixed  inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-[100px] max-w-[200px] h-96 flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold ">Chat</h3>
                    <p className="text-sm opacity-90">{selectedPropertyForChat.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatBox(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Feature</h3>
                <p className="text-gray-600 mb-4">Click the chat button on the property page to start messaging.</p>
                <Link
                  href={`/properties/${selectedPropertyForChat._id}`}
                  className="btn-primary"
                >
                  Go to Property
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 