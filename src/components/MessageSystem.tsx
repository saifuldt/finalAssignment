'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Message, User } from '@/types'
import toast from 'react-hot-toast'
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftIcon,
  ClockIcon,
  CheckIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface MessageSystemProps {
  propertyId: string
  propertyTitle: string
  isOwner: boolean
}

interface MessageWithSender extends Message {
  sender: User
  isRead?: boolean
  isDelivered?: boolean
}

export default function MessageSystem({ propertyId, propertyTitle, isOwner }: MessageSystemProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages
  const fetchMessages = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const newMessages = data.messages || []
        setMessages(newMessages)
        
        // Check for new unread messages
        const unreadCount = newMessages.filter((msg: MessageWithSender) => 
          !isOwnMessage(msg) && !msg.isRead
        ).length
        
        setHasNewMessages(unreadCount > 0)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user) return

    try {
      setSending(true)
      const response = await fetch(`/api/properties/${propertyId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      if (response.ok) {
        setNewMessage('')
        // Add message optimistically
        const tempMessage: MessageWithSender = {
          _id: Date.now().toString(),
          message: newMessage.trim(),
          createdAt: new Date(),
          sender: {
            _id: 'temp',
            name: session.user.name || 'You',
            email: session.user.email || '',
            role: 'user'
          },
          isDelivered: true,
          isRead: false
        }
        setMessages(prev => [...prev, tempMessage])
        
        // Refresh messages to get the real message from server
        setTimeout(() => {
          fetchMessages()
        }, 500)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Mark messages as read
  const markAsRead = async () => {
    if (!session?.user || isOwner) return

    try {
      await fetch(`/api/properties/${propertyId}/messages/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      setHasNewMessages(false)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Open chat and mark messages as read
  const openChat = () => {
    setIsOpen(true)
    if (hasNewMessages) {
      markAsRead()
    }
  }

  // Fetch messages when component mounts or when opened
  useEffect(() => {
    if (isOpen && session?.user) {
      fetchMessages()
    }
  }, [isOpen, session, propertyId])

  // Check for new messages periodically (only when chat is closed)
  useEffect(() => {
    if (isOpen || !session?.user) return

    const interval = setInterval(() => {
      fetchMessages()
    }, 10000) // Check every 10 seconds when closed

    return () => clearInterval(interval)
  }, [isOpen, session, propertyId])

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Check if message is from current user
  const isOwnMessage = (message: MessageWithSender) => {
    return message.sender?.email === session?.user?.email
  }

  // Get unread count
  const unreadCount = messages.filter(msg => 
    !isOwnMessage(msg) && !msg.isRead
  ).length

  if (!session?.user) {
    return null
  }

  // Safety check for property data
  if (!propertyId || !propertyTitle) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Button */}
      {hasNewMessages && !isOpen && (
        <button
          onClick={openChat}
          className="absolute bottom-16 right-0 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors animate-pulse"
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Message Button */}
      <button
        onClick={openChat}
        className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors relative"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
        {unreadCount > 0 && !hasNewMessages && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Message Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Messages</h3>
                  <p className="text-sm opacity-90">{propertyTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Online Status */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{onlineUsers.length + 1} online</span>
              {typingUsers.length > 0 && (
                <span className="text-yellow-300">
                  {typingUsers.join(', ')} typing...
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className=" h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm message-bubble ${
                      isOwnMessage(message)
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {isOwnMessage(message) ? 'You' : message.sender?.name || 'Unknown'}
                      </span>
                      <span className={`text-xs ${
                        isOwnMessage(message) ? 'text-primary-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    
                    {/* Message Content */}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    
                    {/* Message Status */}
                    {isOwnMessage(message) && (
                      <div className="flex justify-end mt-2">
                        {message.isRead ? (
                          <CheckIcon className="h-3 w-3 text-blue-300" />
                        ) : message.isDelivered ? (
                          <CheckIcon className="h-3 w-3 text-gray-300" />
                        ) : (
                          <ClockIcon className="h-3 w-3 text-gray-300" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={1}
                maxLength={500}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {newMessage.length}/500
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 