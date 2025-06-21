import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  type: {
    type: String,
    required: [true, 'Please provide a property type'],
    enum: ['apartment', 'house', 'condo', 'studio'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative'],
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide an address'],
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
    },
    state: {
      type: String,
      required: [true, 'Please provide a state'],
    },
    zipCode: {
      type: String,
      required: [true, 'Please provide a zip code'],
    },
  },
  features: {
    bedrooms: {
      type: Number,
      required: [true, 'Please provide number of bedrooms'],
      min: [0, 'Number of bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Please provide number of bathrooms'],
      min: [0, 'Number of bathrooms cannot be negative'],
    },
    area: {
      type: Number,
      required: [true, 'Please provide the area'],
      min: [0, 'Area cannot be negative'],
    },
    parking: {
      type: Boolean,
      default: false,
    },
    furnished: {
      type: Boolean,
      default: false,
    },
  },
  images: [{
    type: String,
    required: false,
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'pending'],
    default: 'available',
  },
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
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt timestamp before saving
propertySchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Property || mongoose.model('Property', propertySchema) 