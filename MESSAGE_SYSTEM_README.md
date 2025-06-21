# Active Message System - RentNest

## Overview

The Active Message System provides real-time messaging functionality between landlords and tenants in the RentNest application. It includes features like message status indicators, read receipts, real-time updates, and notifications.

## Features

### 🚀 Core Features

1. **Real-time Messaging**
   - Instant message sending and receiving
   - Auto-refresh every 5-30 seconds (configurable)
   - Optimistic UI updates for better UX

2. **Message Status Indicators**
   - 📤 **Sent**: Message has been sent
   - ✅ **Delivered**: Message has been delivered to recipient
   - ✅✅ **Read**: Message has been read by recipient

3. **Active Status Features**
   - Unread message count badges
   - Real-time notifications for new messages
   - Message filtering (All, Unread, Read)
   - Property-based message organization

4. **User Experience**
   - Floating chat widget on property pages
   - Dashboard message management
   - Responsive design for all devices
   - Auto-scroll to latest messages

## Components

### 1. MessageSystem Component
**Location**: `src/components/MessageSystem.tsx`

A floating chat widget that appears on property detail pages.

**Features**:
- Fixed position chat button with unread count badge
- Expandable message panel
- Real-time message updates
- Message status indicators
- Auto-scroll to new messages

**Usage**:
```tsx
<MessageSystem
  propertyId={property._id}
  propertyTitle={property.title}
  isOwner={isOwner}
/>
```

### 2. MessagesDashboard Component
**Location**: `src/components/MessagesDashboard.tsx`

A comprehensive message management interface for the dashboard.

**Features**:
- Message filtering and sorting
- Property-based message grouping
- Read/unread status management
- Message preview with truncation
- Direct links to properties

**Usage**:
```tsx
<MessagesDashboard isLandlord={isLandlord} />
```

### 3. MessageNotification Component
**Location**: `src/components/MessageNotification.tsx`

Global notification system for new messages.

**Features**:
- Automatic message checking every 10 seconds
- Toast notifications for new messages
- Custom notification UI
- Dismissible notifications

## API Endpoints

### 1. Property Messages
- **GET** `/api/properties/[id]/messages` - Fetch messages for a property
- **POST** `/api/properties/[id]/messages` - Send a message to a property
- **POST** `/api/properties/[id]/messages/read` - Mark all messages as read

### 2. Dashboard Messages
- **GET** `/api/messages` - Fetch messages for landlords
- **GET** `/api/messages/tenant` - Fetch messages for tenants
- **POST** `/api/messages/[id]/read` - Mark individual message as read

## Database Schema

### Updated Property Model
```typescript
messages: [{
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: true,
  },
}]
```

### Updated Types
```typescript
export interface Message {
  _id?: string
  sender: string | User
  message: string
  createdAt: Date
  isRead?: boolean
  isDelivered?: boolean
}
```

## Implementation Details

### Real-time Updates
The system uses polling for real-time updates:
- **MessageSystem**: Polls every 5 seconds when open
- **MessagesDashboard**: Polls every 30 seconds
- **MessageNotification**: Polls every 10 seconds

### Message Status Flow
1. **Sent**: Message is created and saved to database
2. **Delivered**: Message is successfully stored (default: true)
3. **Read**: Recipient opens the message or clicks on it

### Optimistic Updates
- Messages appear immediately when sent
- Server sync happens in background
- Fallback to server data if needed

## Usage Examples

### For Landlords
1. View all messages from tenants in dashboard
2. Filter messages by property or status
3. Receive notifications for new inquiries
4. Respond directly from property pages

### For Tenants
1. Send messages to landlords about properties
2. View conversation history in dashboard
3. Receive responses and updates
4. Track message status (sent, delivered, read)

## Styling

### CSS Classes Added
```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Color Scheme
- **Primary**: Blue theme for message bubbles
- **Success**: Green for read status
- **Warning**: Yellow for typing indicators
- **Error**: Red for unread badges

## Future Enhancements

### Planned Features
1. **WebSocket Integration**
   - Replace polling with real-time WebSocket connections
   - Instant message delivery
   - Typing indicators

2. **Advanced Features**
   - File/image sharing
   - Message reactions
   - Message search
   - Message threading

3. **Mobile Optimization**
   - Push notifications
   - Mobile-specific UI improvements
   - Offline message queuing

## Configuration

### Environment Variables
No additional environment variables required.

### Performance Considerations
- Message polling intervals are configurable
- Database indexes on message fields for better performance
- Pagination for large message histories (future enhancement)

## Troubleshooting

### Common Issues
1. **Messages not updating**: Check network connectivity and API endpoints
2. **Notifications not showing**: Ensure toast notifications are enabled
3. **Status not updating**: Verify user authentication and permissions

### Debug Mode
Enable console logging for debugging:
```typescript
// Add to components for debugging
console.log('Message data:', messages)
console.log('User session:', session)
```

## Security

### Authentication
- All endpoints require valid user session
- Messages are scoped to property ownership
- Users can only access their own messages

### Data Validation
- Message content validation (max 500 characters)
- XSS protection through proper escaping
- Input sanitization on all message inputs

---

This active message system provides a comprehensive communication platform for RentNest users, enhancing the rental experience through real-time interaction between landlords and tenants. 