export interface Property {
  _id?: string
  title: string
  description: string
  type: 'apartment' | 'house' | 'condo' | 'studio'
  price: number
  location: {
    address: string
    city: string
    state: string
    zipCode: string
  }
  features: {
    bedrooms: number
    bathrooms: number
    area: number
    parking: boolean
    furnished: boolean
  }
  images: string[]
  owner: string | User
  status: 'available' | 'rented' | 'pending'
  messages?: Message[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Message {
  _id?: string
  sender: string | User
  message: string
  createdAt: Date
}

export interface User {
  _id?: string
  name: string
  email: string
  role: 'user' | 'landlord' | 'admin'
  favorites?: string[]
  createdAt?: Date
}

export interface Booking {
  _id?: string
  property: string | Property
  tenant: string | User
  landlord: string | User
  startDate: Date
  endDate: Date
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  totalAmount: number
  message?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PropertyFormData {
  title: string
  description: string
  price: string | number
  location: string
  city: string
  state: string
  zipCode: string
  bedrooms: string | number
  bathrooms: string | number
  area: string | number
  type: string
  status: string
  images: string[]
  landlordId?: string
} 