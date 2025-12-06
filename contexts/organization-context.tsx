"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export type StaffRole = "admin" | "manager" | "staff"

export interface OrgMember {
  id: string
  userId: string
  name: string
  email: string
  role: StaffRole
  joinedAt: Date
}

export interface Organization {
  id: string
  name: string
  description: string
  logo?: string
  ownerId: string
  members: OrgMember[]
  listingsCount: number
  recoveredCount: number
  createdAt: Date
}

interface OrganizationContextType {
  organizations: Organization[]
  createOrganization: (
    org: Omit<Organization, "id" | "members" | "listingsCount" | "recoveredCount" | "createdAt">,
  ) => Promise<void>
  addMember: (orgId: string, member: Omit<OrgMember, "id" | "joinedAt">) => Promise<void>
  removeMember: (orgId: string, memberId: string) => Promise<void>
  updateMemberRole: (orgId: string, memberId: string, role: StaffRole) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])

  const createOrganization = async (
    orgData: Omit<Organization, "id" | "members" | "listingsCount" | "recoveredCount" | "createdAt">,
  ) => {
    const newOrg: Organization = {
      ...orgData,
      id: Math.random().toString(36).substring(7),
      members: [],
      listingsCount: 0,
      recoveredCount: 0,
      createdAt: new Date(),
    }
    setOrganizations([...organizations, newOrg])
  }

  const addMember = async (orgId: string, memberData: Omit<OrgMember, "id" | "joinedAt">) => {
    setOrganizations(
      organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              members: [
                ...org.members,
                {
                  ...memberData,
                  id: Math.random().toString(36).substring(7),
                  joinedAt: new Date(),
                },
              ],
            }
          : org,
      ),
    )
  }

  const removeMember = async (orgId: string, memberId: string) => {
    setOrganizations(
      organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              members: org.members.filter((m) => m.id !== memberId),
            }
          : org,
      ),
    )
  }

  const updateMemberRole = async (orgId: string, memberId: string, role: StaffRole) => {
    setOrganizations(
      organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              members: org.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
            }
          : org,
      ),
    )
  }

  return (
    <OrganizationContext.Provider
      value={{ organizations, createOrganization, addMember, removeMember, updateMemberRole }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}
