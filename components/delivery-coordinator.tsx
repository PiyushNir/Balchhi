"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useVerification, type DeliveryMethod } from "@/contexts/verification-context"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Mail, Handshake } from "lucide-react"

const deliverySchema = z.object({
  method: z.enum(["in-person", "pickup", "mail"] as const),
  location: z.string().optional(),
  proposedDate: z.string().optional(),
  notes: z.string().optional(),
})

type DeliveryFormValues = z.infer<typeof deliverySchema>

interface DeliveryCoordinatorProps {
  claimId: string
}

export default function DeliveryCoordinator({ claimId }: DeliveryCoordinatorProps) {
  const { createDelivery } = useVerification()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      method: "in-person",
      location: "",
      proposedDate: "",
      notes: "",
    },
  })

  async function onSubmit(values: DeliveryFormValues) {
    setIsLoading(true)
    try {
      await createDelivery({
        claimId,
        method: values.method as DeliveryMethod,
        location: values.location,
        proposedDate: values.proposedDate ? new Date(values.proposedDate) : undefined,
        status: "pending",
        notes: values.notes,
      })

      toast({
        title: "Success",
        description: "Delivery method set. Both parties will be notified.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set delivery method",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arrange Delivery</CardTitle>
        <CardDescription>Choose how you'd like to return the item</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Method</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value="in-person" id="in-person" />
                        <div className="flex-1">
                          <label htmlFor="in-person" className="font-medium cursor-pointer flex items-center gap-2">
                            <Handshake className="w-4 h-4" />
                            In-Person Handover
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">Meet in a public place</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <div className="flex-1">
                          <label htmlFor="pickup" className="font-medium cursor-pointer flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Pickup
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">Specify a pickup location</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value="mail" id="mail" />
                        <div className="flex-1">
                          <label htmlFor="mail" className="font-medium cursor-pointer flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Mail/Courier
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">Ship the item safely</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("method") !== "mail" && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Suggest a public location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="proposedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Any special instructions or preferences"
                      className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Setting up delivery..." : "Confirm Delivery Method"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

