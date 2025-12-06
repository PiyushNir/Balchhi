"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export type ClaimStatus = "pending" | "verified" | "rejected" | "completed"
export type DeliveryMethod = "in-person" | "pickup" | "mail"

export interface Claim {
  id: string
  listingId: string
  claimantId: string
  claimantName: string
  status: ClaimStatus
  description: string
  proofImages: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Delivery {
  id: string
  claimId: string
  method: DeliveryMethod
  location?: string
  proposedDate?: Date
  status: "pending" | "scheduled" | "completed" | "cancelled"
  notes?: string
}

interface VerificationContextType {
  claims: Claim[]
  deliveries: Delivery[]
  createClaim: (claim: Omit<Claim, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateClaimStatus: (claimId: string, status: ClaimStatus) => Promise<void>
  createDelivery: (delivery: Omit<Delivery, "id">) => Promise<void>
  updateDeliveryStatus: (deliveryId: string, status: string) => Promise<void>
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])

  const createClaim = async (claimData: Omit<Claim, "id" | "createdAt" | "updatedAt">) => {
    const newClaim: Claim = {
      ...claimData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setClaims([...claims, newClaim])
  }

  const updateClaimStatus = async (claimId: string, status: ClaimStatus) => {
    setClaims(claims.map((c) => (c.id === claimId ? { ...c, status, updatedAt: new Date() } : c)))
  }

  const createDelivery = async (deliveryData: Omit<Delivery, "id">) => {
    const newDelivery: Delivery = {
      ...deliveryData,
      id: Math.random().toString(36).substring(7),
    }
    setDeliveries([...deliveries, newDelivery])
  }

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    setDeliveries(deliveries.map((d) => (d.id === deliveryId ? { ...d, status } : d)))
  }

  return (
    <VerificationContext.Provider
      value={{ claims, deliveries, createClaim, updateClaimStatus, createDelivery, updateDeliveryStatus }}
    >
      {children}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const context = useContext(VerificationContext)
  if (context === undefined) {
    throw new Error("useVerification must be used within a VerificationProvider")
  }
  return context
}
