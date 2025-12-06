"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#6db8bb]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span 
              className="text-5xl text-[#10375d]"
              style={{ fontFamily: "'Calmingly', cursive" }}
            >
              Balchhi
            </span>
          </Link>
          <h1 
            className="text-3xl text-[#10375d] mt-4"
            style={{ fontFamily: "'Calmingly', cursive" }}
          >
            Welcome back
          </h1>
          <p className="text-[#10375d]/70 mt-2">Sign in to find your lost items</p>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#10375d] text-xl">Sign In</CardTitle>
            <CardDescription className="text-[#869684]">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-8 text-center">
              <p className="text-[#869684]">
                Don't have an account?{" "}
                <Link 
                  href="/signup" 
                  className="text-[#10375d] hover:text-[#05647a] font-semibold"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[#10375d]/60 text-sm mt-8">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#10375d]">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-[#10375d]">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
