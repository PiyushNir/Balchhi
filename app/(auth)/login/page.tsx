"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span 
              className="text-5xl text-[#2B2B2B]"
              style={{ fontFamily: "'Calmingly', cursive" }}
            >
              Balchhi
            </span>
          </Link>
          <h1 
            className="text-3xl text-[#2B2B2B] mt-4"
            style={{ fontFamily: "'Calmingly', cursive" }}
          >
            Welcome back
          </h1>
          <p className="text-[#2B2B2B]/60 mt-2">Sign in to find your lost items</p>
        </div>

        <Card className="border border-[#D4D4D4] shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#2B2B2B] text-xl">Sign In</CardTitle>
            <CardDescription className="text-[#2B2B2B]/50">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-8 text-center">
              <p className="text-[#2B2B2B]/50">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/signup" 
                  className="text-[#2B2B2B] hover:text-[#2B2B2B]/70 font-semibold"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[#2B2B2B]/40 text-sm mt-8">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#2B2B2B]">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-[#2B2B2B]">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

