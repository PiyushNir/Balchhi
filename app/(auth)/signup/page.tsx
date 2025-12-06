"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SignupForm from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#6db8bb]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span 
              className="text-5xl text-[#10375d]"
              style={{ fontFamily: "'Calmingly', cursive" }}
            >
              Balchhi
            </span>
          </Link>
          <p className="text-[#05647a] text-sm mt-4">Join Nepal's trusted Lost & Found community</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#10375d] text-xl">Create Account</CardTitle>
            <CardDescription className="text-[#05647a]">
              Join Balchhi to start finding and posting items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="mt-6 text-center text-sm">
              <p className="text-[#869684]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#05647a] hover:text-[#10375d] font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#10375d]/70 mt-6">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#10375d]">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-[#10375d]">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
