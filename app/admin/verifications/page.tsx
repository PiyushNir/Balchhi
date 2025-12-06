"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Shield, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  MapPin,
  User,
  Mail,
  Calendar,
  AlertCircle
} from "lucide-react"

interface VerificationRequest {
  id: string
  organization_id: string
  status: string
  registration_type: string
  registration_number: string
  established_date: string
  province: string
  district: string
  municipality: string
  ward_number: number
  street_address: string
  postal_code: string
  official_phone?: string | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  created_at: string
  organization: {
    id: string
    name: string
    type: string
  }
  contacts: Array<{
    id: string
    name: string
    role: string
    email: string
    phone: string
    is_primary: boolean
    email_verified: boolean
    phone_verified: boolean
  }>
}

interface CallLog {
  id: string
  call_type: string
  call_status: string
  called_at: string
  call_summary: string | null
  notes?: string | null
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500",
  under_review: "bg-yellow-500",
  pending_call: "bg-orange-500",
  pending_documents: "bg-purple-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  suspended: "bg-gray-700"
}

export default function AdminVerificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [verifications, setVerifications] = useState<Record<string, VerificationRequest[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  // Call log form state
  const [showCallLogDialog, setShowCallLogDialog] = useState(false)
  const [callForm, setCallForm] = useState({
    call_type: "verification",
    outcome: "pending",
    notes: ""
  })
  
  // Rejection form state
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    try {
      const res = await fetch("/api/admin/verifications")
      if (!res.ok) throw new Error("Failed to fetch verifications")
      const data = await res.json()
      const normalized: VerificationRequest[] = (data.verifications || []).map((verification: any) => ({
        ...verification,
        organization_id: verification.organization_id || verification.organization?.id,
        contacts: verification.contacts || [],
        status: verification.verification_status || verification.status
      }))
      const grouped: Record<string, VerificationRequest[]> = {
        draft: [],
        submitted: [],
        under_review: [],
        pending_call: [],
        pending_documents: [],
        approved: [],
        rejected: [],
        suspended: []
      }
      normalized.forEach((verification) => {
        const key = verification.status || "submitted"
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(verification)
      })
      setVerifications(grouped)
    } catch (error) {
      console.error("Error fetching verifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadVerificationDetails = async (organizationId: string, fallback?: VerificationRequest) => {
    setDetailsLoading(true)
    try {
      const res = await fetch(`/api/admin/verifications/${organizationId}`)
      if (!res.ok) throw new Error("Failed to fetch verification details")
      const data = await res.json()
      if (data.verification) {
        setSelectedVerification({
          ...data.verification,
          organization_id: organizationId,
          organization: data.organization,
          contacts: data.contacts || [],
          status: data.verification.verification_status || data.verification.status
        })
      } else {
        setSelectedVerification(fallback || null)
      }
      setCallLogs(data.call_logs || [])
    } catch (error) {
      console.error("Error fetching verification details:", error)
      setSelectedVerification(fallback || null)
      setCallLogs([])
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleSelectVerification = async (verification: VerificationRequest) => {
    setSelectedVerification(verification)
    await loadVerificationDetails(verification.organization_id, verification)
  }

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    if (!selectedVerification) return
    
    setActionLoading(true)
    try {
      const statusActionMap: Record<string, string> = {
        under_review: "start_review",
        pending_call: "schedule_call",
        approved: "approve",
        rejected: "reject"
      }
      const action = statusActionMap[newStatus]
      if (!action) {
        throw new Error("Unsupported status transition")
      }
      const res = await fetch(`/api/admin/verifications/${selectedVerification.organization_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejection_reason: reason
        })
      })
      if (!res.ok) throw new Error("Failed to update status")
      await fetchVerifications()
      await loadVerificationDetails(selectedVerification.organization_id)
      setShowRejectDialog(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCallLog = async () => {
    if (!selectedVerification) return

    const primaryContact = selectedVerification.contacts?.find((contact) => contact.is_primary)
    const phoneNumber = primaryContact?.phone || selectedVerification.official_phone
    if (!phoneNumber) {
      console.error("No phone number available for call log")
      return
    }

    const statusMap: Record<string, string> = {
      pending: "scheduled",
      successful: "completed_verified",
      no_answer: "unreachable",
      callback_requested: "scheduled",
      failed: "completed_failed"
    }
    const callStatus = statusMap[callForm.outcome] || "scheduled"
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/verifications/${selectedVerification.organization_id}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_called: phoneNumber,
          phone_source: "provided",
          call_type: callForm.call_type,
          call_status: callStatus,
          call_summary: callForm.notes
        })
      })
      
      if (!res.ok) throw new Error("Failed to add call log")
      const data = await res.json()
      if (data.call_log) {
        setCallLogs((prev) => [data.call_log, ...prev])
      }
      setShowCallLogDialog(false)
      setCallForm({ call_type: "verification", outcome: "pending", notes: "" })
    } catch (error) {
      console.error("Error adding call log:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const getPendingCount = () => {
    const pendingStatuses = ["submitted", "under_review", "pending_call", "pending_documents"]
    return pendingStatuses.reduce((count, status) => {
      return count + (verifications[status]?.length || 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center">
        <div className="animate-pulse text-[#D4D4D4]">Loading verifications...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2B2B2B] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D4D4D4] flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              Organization Verifications
            </h1>
            <p className="text-[#D4D4D4]/60 mt-1">
              Review and approve organization verification requests
            </p>
          </div>
          <Badge className="bg-orange-500 text-white text-lg px-4 py-2">
            {getPendingCount()} Pending
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Verification List */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="submitted" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="submitted">
                  Submitted ({verifications.submitted?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="pending_call">
                  Pending Call ({verifications.pending_call?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="submitted">
                <div className="space-y-3">
                  {verifications.submitted?.length === 0 ? (
                    <Card className="bg-[#3B3B3B] border-[#4B4B4B]">
                      <CardContent className="p-6 text-center text-[#D4D4D4]/60">
                        No submitted verifications
                      </CardContent>
                    </Card>
                  ) : (
                    verifications.submitted?.map((v) => (
                      <VerificationCard
                        key={v.id}
                        verification={v}
                        isSelected={selectedVerification?.organization_id === v.organization_id}
                        onClick={() => handleSelectVerification(v)}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pending_call">
                <div className="space-y-3">
                  {verifications.pending_call?.length === 0 ? (
                    <Card className="bg-[#3B3B3B] border-[#4B4B4B]">
                      <CardContent className="p-6 text-center text-[#D4D4D4]/60">
                        No pending calls
                      </CardContent>
                    </Card>
                  ) : (
                    verifications.pending_call?.map((v) => (
                      <VerificationCard
                        key={v.id}
                        verification={v}
                        isSelected={selectedVerification?.organization_id === v.organization_id}
                        onClick={() => handleSelectVerification(v)}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Recent Activity */}
            <Card className="mt-6 bg-[#3B3B3B] border-[#4B4B4B]">
              <CardHeader>
                <CardTitle className="text-[#D4D4D4] text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {verifications.approved?.slice(0, 3).map((v) => (
                  <div key={v.id} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-[#D4D4D4]">{v.organization?.name}</span>
                    <Badge className="bg-green-500/20 text-green-400 text-xs">Approved</Badge>
                  </div>
                ))}
                {verifications.rejected?.slice(0, 2).map((v) => (
                  <div key={v.id} className="flex items-center gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-[#D4D4D4]">{v.organization?.name}</span>
                    <Badge className="bg-red-500/20 text-red-400 text-xs">Rejected</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Verification Details */}
          <div className="lg:col-span-2">
            {selectedVerification ? (
              <Card className="bg-[#3B3B3B] border-[#4B4B4B]">
                <CardHeader className="border-b border-[#4B4B4B]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#D4D4D4] flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {selectedVerification.organization?.name}
                      </CardTitle>
                      <CardDescription className="text-[#D4D4D4]/60">
                        Submitted {new Date(selectedVerification.submitted_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusColors[selectedVerification.status]} text-white`}>
                      {selectedVerification.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                
                {detailsLoading ? (
                  <CardContent className="p-6">
                    <div className="text-center text-[#D4D4D4]/70">Loading verification details...</div>
                  </CardContent>
                ) : (
                  <CardContent className="p-6 space-y-6">
                    {/* Registration Details */}
                    <div>
                      <h3 className="text-[#D4D4D4] font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Registration Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[#D4D4D4]/60">Type:</span>
                          <span className="text-[#D4D4D4] ml-2">{selectedVerification.registration_type}</span>
                        </div>
                        <div>
                          <span className="text-[#D4D4D4]/60">Number:</span>
                          <span className="text-[#D4D4D4] ml-2">{selectedVerification.registration_number}</span>
                        </div>
                        <div>
                          <span className="text-[#D4D4D4]/60">Established:</span>
                          <span className="text-[#D4D4D4] ml-2">
                            {new Date(selectedVerification.established_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#D4D4D4]/60">Org Type:</span>
                          <span className="text-[#D4D4D4] ml-2">{selectedVerification.organization?.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-[#D4D4D4] font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </h3>
                      <p className="text-[#D4D4D4] text-sm">
                        {selectedVerification.street_address}, Ward {selectedVerification.ward_number}
                        <br />
                        {selectedVerification.municipality}, {selectedVerification.district}
                        <br />
                        {selectedVerification.province} {selectedVerification.postal_code && `- ${selectedVerification.postal_code}`}
                      </p>
                    </div>

                    {/* Contacts */}
                    <div>
                      <h3 className="text-[#D4D4D4] font-semibold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Contacts
                      </h3>
                      <div className="space-y-3">
                        {selectedVerification.contacts?.map((contact) => (
                          <div key={contact.id} className="bg-[#2B2B2B] rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#D4D4D4] font-medium">
                                  {contact.name} 
                                  {contact.is_primary && (
                                    <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">Primary</Badge>
                                  )}
                                </p>
                                <p className="text-[#D4D4D4]/60 text-sm">{contact.role}</p>
                              </div>
                              <div className="text-right text-sm">
                                <p className="text-[#D4D4D4] flex items-center gap-2 justify-end">
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                  {contact.phone_verified && (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  )}
                                </p>
                                <p className="text-[#D4D4D4] flex items-center gap-2 justify-end">
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                  {contact.email_verified && (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Call Logs */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[#D4D4D4] font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Call Logs
                        </h3>
                        <Dialog open={showCallLogDialog} onOpenChange={setShowCallLogDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-[#D4D4D4]">
                              <Phone className="w-3 h-3 mr-1" />
                              Log Call
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#3B3B3B] border-[#4B4B4B]">
                            <DialogHeader>
                              <DialogTitle className="text-[#D4D4D4]">Log Verification Call</DialogTitle>
                              <DialogDescription className="text-[#D4D4D4]/60">
                                Record details of the verification call
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label className="text-[#D4D4D4]">Call Type</Label>
                                <select
                                  className="w-full mt-1 bg-[#2B2B2B] border border-[#4B4B4B] rounded-md p-2 text-[#D4D4D4]"
                                  value={callForm.call_type}
                                  onChange={(e) => setCallForm({ ...callForm, call_type: e.target.value })}
                                >
                                  <option value="verification">Verification</option>
                                  <option value="follow_up">Follow Up</option>
                                  <option value="document_request">Document Request</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-[#D4D4D4]">Outcome</Label>
                                <select
                                  className="w-full mt-1 bg-[#2B2B2B] border border-[#4B4B4B] rounded-md p-2 text-[#D4D4D4]"
                                  value={callForm.outcome}
                                  onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="successful">Successful</option>
                                  <option value="no_answer">No Answer</option>
                                  <option value="callback_requested">Callback Requested</option>
                                  <option value="failed">Failed</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-[#D4D4D4]">Notes</Label>
                                <textarea
                                  className="w-full mt-1 bg-[#2B2B2B] border border-[#4B4B4B] rounded-md p-2 text-[#D4D4D4] min-h-[100px]"
                                  value={callForm.notes}
                                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                                  placeholder="Enter call notes..."
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleAddCallLog}
                                disabled={actionLoading}
                              >
                                {actionLoading ? "Saving..." : "Save Call Log"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {callLogs.length === 0 ? (
                        <p className="text-[#D4D4D4]/60 text-sm">No call logs yet</p>
                      ) : (
                        <div className="space-y-2">
                          {callLogs.map((log) => (
                            <div key={log.id} className="bg-[#2B2B2B] rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[#D4D4D4]">
                                  {log.call_type} - {log.call_status}
                                </span>
                                <span className="text-[#D4D4D4]/60">
                                  {new Date(log.called_at).toLocaleDateString()}
                                </span>
                              </div>
                              {(log.call_summary || log.notes) && (
                                <p className="text-[#D4D4D4]/60">{log.call_summary || log.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-[#4B4B4B]">
                      {selectedVerification.status === "submitted" && (
                        <>
                          <Button
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                            onClick={() => handleStatusUpdate("under_review")}
                            disabled={actionLoading}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Start Review
                          </Button>
                          <Button
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleStatusUpdate("pending_call")}
                            disabled={actionLoading}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Need Call
                          </Button>
                        </>
                      )}
                      
                      {(selectedVerification.status === "under_review" || 
                        selectedVerification.status === "pending_call") && (
                        <>
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate("approved")}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={actionLoading}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#3B3B3B] border-[#4B4B4B]">
                              <DialogHeader>
                                <DialogTitle className="text-[#D4D4D4]">Reject Verification</DialogTitle>
                                <DialogDescription className="text-[#D4D4D4]/60">
                                  Please provide a reason for rejection
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div>
                                  <Label className="text-[#D4D4D4]">Rejection Reason</Label>
                                  <textarea
                                    className="w-full mt-1 bg-[#2B2B2B] border border-[#4B4B4B] rounded-md p-2 text-[#D4D4D4] min-h-[100px]"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => handleStatusUpdate("rejected", rejectionReason)}
                                  disabled={actionLoading || !rejectionReason}
                                >
                                  {actionLoading ? "Processing..." : "Confirm Rejection"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ) : (
              <Card className="bg-[#3B3B3B] border-[#4B4B4B] h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <Shield className="w-16 h-16 text-[#4B4B4B] mx-auto mb-4" />
                  <p className="text-[#D4D4D4]/60 text-lg">
                    Select a verification request to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VerificationCard({ 
  verification, 
  isSelected, 
  onClick 
}: { 
  verification: VerificationRequest
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <Card 
      className={`bg-[#3B3B3B] border-[#4B4B4B] cursor-pointer transition-all hover:border-blue-500/50 ${
        isSelected ? "border-blue-500 ring-1 ring-blue-500" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[#D4D4D4] font-medium">
              {verification.organization?.name}
            </p>
            <p className="text-[#D4D4D4]/60 text-sm">
              {verification.registration_type} • {verification.registration_number}
            </p>
          </div>
          <Badge className={`${statusColors[verification.status]} text-white text-xs`}>
            {verification.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-[#D4D4D4]/60">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(verification.submitted_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {verification.district}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
