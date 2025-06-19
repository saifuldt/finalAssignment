'use client'

import { useState } from 'react'
import { Property } from '@/types'
import toast from 'react-hot-toast'

interface BookingFormProps {
  property: Property
  onSuccess?: () => void
  onCancel?: () => void
}

export default function BookingForm({ property, onSuccess, onCancel }: BookingFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property._id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          message: formData.message
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create booking')
      }

      toast.success('Booking request sent successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalAmount = () => {
    if (!formData.startDate || !formData.endDate) return 0
    
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    return property.price * Math.max(1, monthsDiff)
  }

  const totalAmount = calculateTotalAmount()

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Book This Property</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message to Landlord (Optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={3}
            className="input-field"
            placeholder="Tell the landlord about your interest in this property..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.message.length}/500 characters
          </p>
        </div>

        {totalAmount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monthly Rent:</span>
                <span>${property.price}/month</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>
                  {formData.startDate && formData.endDate ? (
                    (() => {
                      const start = new Date(formData.startDate)
                      const end = new Date(formData.endDate)
                      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
                      return `${Math.max(1, monthsDiff)} month(s)`
                    })()
                  ) : (
                    'Select dates'
                  )}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span>${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !formData.startDate || !formData.endDate}
            className="btn-primary flex-1"
          >
            {loading ? 'Sending Request...' : 'Send Booking Request'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
} 