"use client"

import { useEffect } from "react"
import Header from "@/components/header"
import Hero from "@/components/hero"
import Footer from "@/components/footer"
import FishingHook from "@/components/fishing-hook"
import { HookProvider } from "@/contexts/hook-context"
import {
  HowItWorksSection,
  TrustedVerificationSection,
  DeliverySection,
  ForOrganizationsSection,
  StatsSection,
  CTASection,
  ContactSection,
} from "@/components/landing-sections"

export default function Home() {
  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <HookProvider>
      <main className="min-h-screen flex flex-col">
        <Header />
        <FishingHook />
        <Hero />
        <HowItWorksSection />
        <TrustedVerificationSection />
        <DeliverySection />
        <ForOrganizationsSection />
        <StatsSection />
        <CTASection />
        <ContactSection />
        <Footer />
      </main>
    </HookProvider>
  )
}

