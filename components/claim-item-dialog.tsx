"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useVerification } from "@/contexts/verification-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Shield } from "lucide-react"

const claimSchema = z.object({
  description: z.string().min(20, "Please provide details about why this is your item (min 20 characters)"),
})

type ClaimFormValues = z.infer<typeof claimSchema>

interface ClaimItemDialogProps {
  listingId: string
  listingTitle: string
}

export default function ClaimItemDialog({ listingId, listingTitle }: ClaimItemDialogProps) {
  const { user } = useAuth()
  const { createClaim } = useVerification()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      description: "",
    },
  })

  async function onSubmit(values: ClaimFormValues) {
    if (!user) return

    setIsLoading(true)
    try {
      await createClaim({
        listingId,
        claimantId: user.id,
        claimantName: user.name,
        status: "pending",
        description: values.description,
        proofImages: [],
      })

      toast({
        title: "Success",
        description: "Your claim has been submitted. The poster will review it shortly.",
      })
      setOpen(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-[#05647a] hover:bg-[#10375d] text-[#e0e2d5] font-semibold">
          <Shield className="w-4 h-4 mr-2" />
          This is my item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-[#10375d] text-xl">Claim This Item</DialogTitle>
          <DialogDescription className="text-[#869684]">
            Help us verify that "{listingTitle}" belongs to you
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#10375d] font-medium">Why is this your item?</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Describe specific details that prove this is your item (color, marks, where you lost it, etc.)"
                      className="flex min-h-28 w-full rounded-xl border-2 border-[#6db8bb] bg-transparent px-4 py-3 text-base text-[#10375d] placeholder:text-[#869684] focus-visible:outline-none focus-visible:border-[#05647a] focus-visible:ring-[#05647a]/20 focus-visible:ring-4 transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <div className="space-y-2 p-4 bg-[#6db8bb]/10 rounded-xl text-sm border border-[#6db8bb]/30">
              <p className="font-semibold text-[#10375d]">Before you claim:</p>
              <ul className="list-disc list-inside space-y-1 text-[#05647a]">
                <li>Be honest and specific in your description</li>
                <li>Provide details only you would know</li>
                <li>Be prepared for verification questions</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                className="flex-1 border-[#6db8bb] text-[#05647a] hover:bg-[#6db8bb]/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex-1 bg-[#10375d] hover:bg-[#05647a] text-[#e0e2d5]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Claim"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
