"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Phone, 
  XCircle, 
  AlertTriangle,
  Shield,
  ArrowRight
} from "lucide-react"

type VerificationStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_call'
  | 'pending_documents'
  | 'rejected'
  | 'approved'
  | 'suspended'

interface OrgVerificationStatusProps {
  status: VerificationStatus
  submittedAt?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  onStartVerification?: () => void
}

const statusConfig: Record<VerificationStatus, {
  label: string
  description: string
  icon: ReactNode
  color: string
  bgColor: string
}> = {
  draft: {
    label: 'Not Started',
    description: 'Complete the verification form to get started',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  submitted: {
    label: 'Submitted',
    description: 'Your verification is in the queue for review',
    icon: <Clock className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  under_review: {
    label: 'Under Review',
    description: 'An admin is currently reviewing your documents',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  pending_call: {
    label: 'Pending Call',
    description: 'We will call your organization to verify details',
    icon: <Phone className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  pending_documents: {
    label: 'Additional Documents Needed',
    description: 'Please upload the requested documents',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  rejected: {
    label: 'Rejected',
    description: 'Your verification was rejected. You can resubmit.',
    icon: <XCircle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  approved: {
    label: 'Verified',
    description: 'Your organization is verified and can post items',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  suspended: {
    label: 'Suspended',
    description: 'Your organization has been suspended. Contact support.',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
}

const verificationSteps = [
  { key: 'draft', label: 'Fill Details' },
  { key: 'submitted', label: 'Submit' },
  { key: 'under_review', label: 'Review' },
  { key: 'pending_call', label: 'Phone Call' },
  { key: 'approved', label: 'Approved' }
]

export default function OrgVerificationStatus({
  status,
  submittedAt,
  approvedAt,
  rejectionReason,
  onStartVerification
}: OrgVerificationStatusProps) {
  const config = statusConfig[status]
  
  const currentStepIndex = verificationSteps.findIndex(s => s.key === status)
  const isRejectedOrSuspended = status === 'rejected' || status === 'suspended'

  return (
    <Card className="bg-white border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#2B2B2B]">Verification Status</CardTitle>
            <CardDescription className="text-[#2B2B2B]/70">
              Organizations must be verified before posting items
            </CardDescription>
          </div>
          <Badge className={`${config.bgColor} ${config.color} border-0 px-3 py-1`}>
            {config.icon}
            <span className="ml-2">{config.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        {!isRejectedOrSuspended && (
          <div className="flex items-center justify-between">
            {verificationSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex || status === 'approved'
              const isCurrent = step.key === status || 
                (status === 'pending_documents' && step.key === 'under_review') ||
                (status === 'pending_call' && step.key === 'pending_call')
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? 'bg-green-500 text-white' : 
                        isCurrent ? 'bg-[#2B2B2B] text-white' : 
                        'bg-gray-200 text-gray-500'}`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className={`text-xs mt-1 ${isCurrent ? 'font-medium text-[#2B2B2B]' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < verificationSteps.length - 1 && (
                    <ArrowRight className={`w-4 h-4 mx-2 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Status Message */}
        <div className={`p-4 rounded-lg ${config.bgColor}`}>
          <div className="flex items-start gap-3">
            <div className={config.color}>{config.icon}</div>
            <div>
              <p className={`font-medium ${config.color}`}>{config.label}</p>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
              
              {status === 'rejected' && rejectionReason && (
                <p className="text-sm text-red-700 mt-2 p-2 bg-red-50 rounded">
                  <strong>Reason:</strong> {rejectionReason}
                </p>
              )}
              
              {submittedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {new Date(submittedAt).toLocaleDateString('en-NP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
              
              {status === 'approved' && approvedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Approved: {new Date(approvedAt).toLocaleDateString('en-NP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {(status === 'draft' || status === 'rejected') && onStartVerification && (
          <button
            onClick={onStartVerification}
            className="w-full py-3 px-4 bg-[#2B2B2B] text-white rounded-lg font-medium hover:bg-[#3B3B3B] transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {status === 'draft' ? 'Start Verification' : 'Resubmit Verification'}
          </button>
        )}

        {status === 'approved' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">
              Your organization can now post lost & found items!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
