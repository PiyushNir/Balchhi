"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["individual", "organization"] as const),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "individual",
    },
  })

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true)
    try {
      await signup(values.email, values.password, values.name, values.role as UserRole)
      toast({
        title: "Success",
        description: "Account created successfully",
      })
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#10375d] font-medium">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your full name" 
                  className="border-[#6db8bb] focus:border-[#05647a] focus:ring-[#05647a]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#10375d] font-medium">Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="your@email.com" 
                  type="email" 
                  className="border-[#6db8bb] focus:border-[#05647a] focus:ring-[#05647a]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#10375d] font-medium">Phone Number <span className="text-[#869684] font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="+977 98XXXXXXXX" 
                  type="tel" 
                  className="border-[#6db8bb] focus:border-[#05647a] focus:ring-[#05647a]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#10375d] font-medium">Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    className="border-[#6db8bb] focus:border-[#05647a] focus:ring-[#05647a]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-600" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#10375d] font-medium">Confirm</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    className="border-[#6db8bb] focus:border-[#05647a] focus:ring-[#05647a]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-600" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="pt-2">
              <FormLabel className="text-[#10375d] font-medium">Account Type</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3 pt-2">
                  <label 
                    htmlFor="individual" 
                    className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      field.value === 'individual' 
                        ? 'border-[#05647a] bg-[#6db8bb]/10' 
                        : 'border-[#e0e2d5] hover:border-[#6db8bb]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="individual" id="individual" className="border-[#05647a] text-[#05647a]" />
                      <span className="text-sm font-semibold text-[#10375d]">Individual</span>
                    </div>
                    <p className="text-xs text-[#869684] mt-1 ml-6">Post and find lost items</p>
                  </label>
                  <label 
                    htmlFor="organization" 
                    className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      field.value === 'organization' 
                        ? 'border-[#05647a] bg-[#6db8bb]/10' 
                        : 'border-[#e0e2d5] hover:border-[#6db8bb]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="organization" id="organization" className="border-[#05647a] text-[#05647a]" />
                      <span className="text-sm font-semibold text-[#10375d]">Organization</span>
                    </div>
                    <p className="text-xs text-[#869684] mt-1 ml-6">Manage team & listings</p>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-[#10375d] hover:bg-[#05647a] text-[#e0e2d5] font-semibold py-5 mt-4 transition-colors" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  )
}
