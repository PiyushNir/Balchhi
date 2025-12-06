"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  Building, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Send
} from "lucide-react"

// Nepal provinces and their districts
const nepalProvinces: Record<string, string[]> = {
  'Koshi': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Palpa', 'Parasi', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  'Karnali': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
  'Sudurpashchim': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur']
}

const registrationTypes = [
  { value: 'pan', label: 'PAN (Permanent Account Number)' },
  { value: 'vat', label: 'VAT Registration' },
  { value: 'company_registrar', label: 'Company Registrar' },
  { value: 'education_board', label: 'Education Board' },
  { value: 'hospital_license', label: 'Hospital License' },
  { value: 'hotel_license', label: 'Hotel/Tourism License' },
  { value: 'transport_license', label: 'Transport License' },
  { value: 'police_unit', label: 'Police Station Code' },
  { value: 'government_office', label: 'Government Office' },
  { value: 'bank_license', label: 'Bank License (NRB)' },
  { value: 'ngo_registration', label: 'NGO Registration' },
  { value: 'other', label: 'Other' }
]

interface VerificationFormData {
  registered_name: string
  registration_type: string
  registration_number: string
  registration_date: string
  registration_authority: string
  province: string
  district: string
  municipality: string
  ward_number: string
  street_address: string
  postal_code: string
  official_email: string
  official_phone: string
  official_phone_alt: string
  official_website: string
}

interface OrgVerificationFormProps {
  organizationId: string
  initialData?: Partial<VerificationFormData>
  onSave?: (data: VerificationFormData) => Promise<void>
  onSubmit?: (data: VerificationFormData) => Promise<void>
  isLoading?: boolean
}

export default function OrgVerificationForm({
  organizationId,
  initialData,
  onSave,
  onSubmit,
  isLoading = false
}: OrgVerificationFormProps) {
  const [formData, setFormData] = useState<VerificationFormData>({
    registered_name: '',
    registration_type: '',
    registration_number: '',
    registration_date: '',
    registration_authority: '',
    province: '',
    district: '',
    municipality: '',
    ward_number: '',
    street_address: '',
    postal_code: '',
    official_email: '',
    official_phone: '',
    official_phone_alt: '',
    official_website: '',
    ...initialData
  })

  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'blocked' | 'trusted'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Documents state
  const [documents, setDocuments] = useState({
    registration_certificate: null as File | null,
    pan_certificate: null as File | null,
    vat_certificate: null as File | null,
    letterhead: null as File | null
  })

  const districts = formData.province ? nepalProvinces[formData.province] || [] : []

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData
      }))
    }
  }, [initialData])

  // Check email domain when email changes
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.official_email || !formData.official_email.includes('@')) {
        setEmailStatus('idle')
        return
      }

      setEmailStatus('checking')
      
      try {
        const response = await fetch(`/api/organizations/${organizationId}/email-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'check',
            email: formData.official_email 
          })
        })
        
        const data = await response.json()
        
        if (data.is_blocked) {
          setEmailStatus('blocked')
        } else if (data.is_trusted) {
          setEmailStatus('trusted')
        } else {
          setEmailStatus('valid')
        }
      } catch {
        setEmailStatus('idle')
      }
    }

    const debounce = setTimeout(checkEmail, 500)
    return () => clearTimeout(debounce)
  }, [formData.official_email, organizationId])

  const handleChange = (field: keyof VerificationFormData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'province') {
        next.district = ''
      }
      return next
    })
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.registered_name) newErrors.registered_name = 'Required'
    if (!formData.registration_type) newErrors.registration_type = 'Required'
    if (!formData.registration_number) newErrors.registration_number = 'Required'
    if (!formData.province) newErrors.province = 'Required'
    if (!formData.district) newErrors.district = 'Required'
    if (!formData.municipality) newErrors.municipality = 'Required'
    if (!formData.official_email) newErrors.official_email = 'Required'
    if (!formData.official_phone) newErrors.official_phone = 'Required'
    
    if (formData.official_email && !formData.official_email.includes('@')) {
      newErrors.official_email = 'Invalid email'
    }
    
    if (emailStatus === 'blocked') {
      newErrors.official_email = 'Generic email domains are not allowed'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!onSave) return
    
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!onSubmit) return
    if (!validateForm()) return
    
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Registration Details */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#2B2B2B]" />
            <CardTitle className="text-[#2B2B2B]">Registration Details</CardTitle>
          </div>
          <CardDescription>Official registration information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="registered_name">Registered Name *</Label>
              <Input
                id="registered_name"
                value={formData.registered_name}
                onChange={(e) => handleChange('registered_name', e.target.value)}
                placeholder="Official registered organization name"
                className={errors.registered_name ? 'border-red-500' : ''}
              />
              {errors.registered_name && (
                <p className="text-red-500 text-xs mt-1">{errors.registered_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="registration_type">Registration Type *</Label>
              <Select 
                value={formData.registration_type} 
                onValueChange={(v) => handleChange('registration_type', v)}
              >
                <SelectTrigger className={errors.registration_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {registrationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.registration_type && (
                <p className="text-red-500 text-xs mt-1">{errors.registration_type}</p>
              )}
            </div>

            <div>
              <Label htmlFor="registration_number">Registration Number *</Label>
              <Input
                id="registration_number"
                value={formData.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                placeholder="e.g., 123456789"
                className={errors.registration_number ? 'border-red-500' : ''}
              />
              {errors.registration_number && (
                <p className="text-red-500 text-xs mt-1">{errors.registration_number}</p>
              )}
            </div>

            <div>
              <Label htmlFor="registration_date">Registration Date</Label>
              <Input
                id="registration_date"
                type="date"
                value={formData.registration_date}
                onChange={(e) => handleChange('registration_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="registration_authority">Issuing Authority</Label>
              <Input
                id="registration_authority"
                value={formData.registration_authority}
                onChange={(e) => handleChange('registration_authority', e.target.value)}
                placeholder="e.g., Inland Revenue Department"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#2B2B2B]" />
            <CardTitle className="text-[#2B2B2B]">Address</CardTitle>
          </div>
          <CardDescription>Official registered address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="province">Province *</Label>
              <Select 
                value={formData.province} 
                onValueChange={(v) => handleChange('province', v)}
              >
                <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(nepalProvinces).map(province => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-red-500 text-xs mt-1">{errors.province}</p>
              )}
            </div>

            <div>
              <Label htmlFor="district">District *</Label>
              <Select 
                value={formData.district} 
                onValueChange={(v) => handleChange('district', v)}
                disabled={!formData.province}
              >
                <SelectTrigger className={errors.district ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.district && (
                <p className="text-red-500 text-xs mt-1">{errors.district}</p>
              )}
            </div>

            <div>
              <Label htmlFor="municipality">Municipality *</Label>
              <Input
                id="municipality"
                value={formData.municipality}
                onChange={(e) => handleChange('municipality', e.target.value)}
                placeholder="e.g., Kathmandu Metropolitan"
                className={errors.municipality ? 'border-red-500' : ''}
              />
              {errors.municipality && (
                <p className="text-red-500 text-xs mt-1">{errors.municipality}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ward_number">Ward Number</Label>
              <Input
                id="ward_number"
                type="number"
                value={formData.ward_number}
                onChange={(e) => handleChange('ward_number', e.target.value)}
                placeholder="e.g., 5"
                min="1"
                max="35"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => handleChange('street_address', e.target.value)}
                placeholder="e.g., New Baneshwor, near City Center"
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="e.g., 44600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#2B2B2B]" />
            <CardTitle className="text-[#2B2B2B]">Contact Information</CardTitle>
          </div>
          <CardDescription>Official contact details for verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="official_email">Official Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="official_email"
                  type="email"
                  value={formData.official_email}
                  onChange={(e) => handleChange('official_email', e.target.value)}
                  placeholder="e.g., info@yourorg.com.np"
                  className={`pl-10 ${errors.official_email ? 'border-red-500' : ''}`}
                />
                {emailStatus === 'checking' && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
                {emailStatus === 'valid' && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {emailStatus === 'trusted' && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                )}
                {emailStatus === 'blocked' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                )}
              </div>
              {emailStatus === 'blocked' && (
                <p className="text-red-500 text-xs mt-1">
                  Generic email providers (gmail, yahoo, etc.) are not allowed. Use your organization&apos;s domain.
                </p>
              )}
              {emailStatus === 'trusted' && (
                <p className="text-blue-600 text-xs mt-1">
                  This is a trusted government/institutional domain
                </p>
              )}
              {errors.official_email && emailStatus !== 'blocked' && (
                <p className="text-red-500 text-xs mt-1">{errors.official_email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="official_phone">Official Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="official_phone"
                  value={formData.official_phone}
                  onChange={(e) => handleChange('official_phone', e.target.value)}
                  placeholder="e.g., 01-4XXXXXX"
                  className={`pl-10 ${errors.official_phone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.official_phone && (
                <p className="text-red-500 text-xs mt-1">{errors.official_phone}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                This number will be called for verification
              </p>
            </div>

            <div>
              <Label htmlFor="official_phone_alt">Alternative Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="official_phone_alt"
                  value={formData.official_phone_alt}
                  onChange={(e) => handleChange('official_phone_alt', e.target.value)}
                  placeholder="e.g., 98XXXXXXXX"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="official_website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="official_website"
                  value={formData.official_website}
                  onChange={(e) => handleChange('official_website', e.target.value)}
                  placeholder="e.g., https://www.yourorg.com.np"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2B2B2B]" />
            <CardTitle className="text-[#2B2B2B]">Documents</CardTitle>
          </div>
          <CardDescription>Upload verification documents (PDF or images)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'registration_certificate', label: 'Registration Certificate *', required: true },
              { key: 'pan_certificate', label: 'PAN Certificate', required: false },
              { key: 'vat_certificate', label: 'VAT Certificate', required: false },
              { key: 'letterhead', label: 'Sample Letterhead', required: false }
            ].map(doc => (
              <div key={doc.key}>
                <Label>{doc.label}</Label>
                <div className="mt-1">
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {documents[doc.key as keyof typeof documents] ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600">
                          {documents[doc.key as keyof typeof documents]?.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(
                        doc.key as keyof typeof documents, 
                        e.target.files?.[0] || null
                      )}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={saving || submitting || isLoading}
          className="gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || submitting || isLoading}
          className="gap-2 bg-[#2B2B2B] hover:bg-[#3B3B3B]"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit for Verification
        </Button>
      </div>
    </div>
  )
}
