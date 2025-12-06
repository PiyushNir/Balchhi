"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useVerification, type Claim } from "@/contexts/verification-context"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, MessageCircle } from "lucide-react"

interface VerifyClaimDialogProps {
  claim: Claim
}

export default function VerifyClaimDialog({ claim }: VerifyClaimDialogProps) {
  const { updateClaimStatus } = useVerification()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleVerify(status: "verified" | "rejected") {
    setIsLoading(true)
    try {
      await updateClaimStatus(claim.id, status)
      toast({
        title: "Success",
        description: `Claim ${status === "verified" ? "verified" : "rejected"} successfully`,
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update claim status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          Review Claim
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Claim</DialogTitle>
          <DialogDescription>Verify if {claim.claimantName} is the rightful owner</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium mb-2">Claimant's Statement:</p>
            <p className="text-sm text-muted-foreground">{claim.description}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-sm">Claimant Information:</p>
            <p className="text-sm">
              Name: <span className="font-medium">{claim.claimantName}</span>
            </p>
            <p className="text-sm">
              Claimed on: <span className="font-medium">{new Date(claim.createdAt).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => {
                // In production, would open messaging interface
                alert("Open messaging with claimant to ask questions")
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask Questions
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" disabled={isLoading} onClick={() => handleVerify("rejected")}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject Claim
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              onClick={() => handleVerify("verified")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Claim
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
