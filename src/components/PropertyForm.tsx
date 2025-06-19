import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Property, PropertyFormData } from '@/types'

interface PropertyFormProps {
  initialData?: Property
  onSubmit: (data: Partial<Property>) => Promise<void>
  loading?: boolean
  isEditing?: boolean
}

export default function PropertyForm({ initialData, onSubmit, loading: externalLoading, isEditing = false }: PropertyFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [internalLoading, setInternalLoading] = useState(false)
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [formData, setFormData] = useState<PropertyFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    location: initialData?.location?.address || '',
    city: initialData?.location?.city || '',
    state: initialData?.location?.state || '',
    zipCode: initialData?.location?.zipCode || '',
    bedrooms: initialData?.features?.bedrooms || '',
    bathrooms: initialData?.features?.bathrooms || '',
    area: initialData?.features?.area || '',
    type: initialData?.type || 'apartment',
    status: initialData?.status || 'available',
    images: initialData?.images || [],
  })

  // Use external loading if provided, otherwise use internal loading
  const loading = externalLoading !== undefined ? externalLoading : internalLoading

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    console.log(`Attempting to upload ${files.length} file(s)`)
    setInternalLoading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Please select a file smaller than 10MB.`)
          continue
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image. Please select an image file.`)
          continue
        }

        const reader = new FileReader()
        
        reader.onloadend = async () => {
          const base64String = reader.result as string
          console.log(`File ${file.name} converted to base64, length: ${base64String.length}`)
          
          try {
            console.log('Sending upload request to /api/upload')
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ image: base64String }),
            })
            
            console.log(`Upload response status: ${response.status}`)
            
            if (response.ok) {
              const data = await response.json()
              console.log('Upload successful, URL:', data.url)
              setImages(prev => {
                const newImages = [...prev, data.url]
                console.log('Updated images array:', newImages)
                return newImages
              })
            } else {
              const errorData = await response.json()
              console.error('Failed to upload image:', errorData.error)
              alert(`Failed to upload ${file.name}: ${errorData.error || 'Unknown error'}`)
            }
          } catch (error) {
            console.error('Error uploading image:', error)
            alert(`Failed to upload ${file.name}: Network error`)
          }
        }
        
        reader.onerror = () => {
          console.error('Error reading file:', file.name)
          alert(`Failed to read file ${file.name}`)
        }
        
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images. Please try again.')
    } finally {
      setInternalLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalLoading(true)

    try {
      console.log('Submitting property with images:', images)
      
      const propertyData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'apartment' | 'house' | 'condo' | 'studio',
        price: Number(formData.price),
        location: {
          address: formData.location,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        features: {
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          area: Number(formData.area),
          parking: false,
          furnished: false,
        },
        images,
        status: formData.status as 'available' | 'rented' | 'pending',
      }

      console.log('Property data being submitted:', propertyData)
      await onSubmit(propertyData)
      if (!isEditing) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error submitting property:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="input-field"
          placeholder="Enter property title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="input-field"
          placeholder="Describe your property"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input-field pl-7"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="input-field"
            placeholder="Enter property address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="input-field"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            required
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="input-field"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
          <input
            type="text"
            required
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            className="input-field"
            placeholder="Enter ZIP code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <input
            type="number"
            required
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            className="input-field"
            placeholder="Number of bedrooms"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <input
            type="number"
            required
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            className="input-field"
            placeholder="Number of bathrooms"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq ft)</label>
          <input
            type="number"
            required
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            className="input-field"
            placeholder="Property area"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="input-field"
          >
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input-field"
          >
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="input-field"
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">Upload multiple images (max 10MB each)</p>
        
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Property' : 'Create Property')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  )
} 