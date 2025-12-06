"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export interface SearchFilters {
  type?: "lost" | "found"
  category?: string
  location?: string
  dateRange?: {
    from: Date
    to: Date
  }
  distance?: number
  sortBy?: "recent" | "relevant" | "popular"
}

export interface SearchResult {
  id: string
  title: string
  type: "lost" | "found"
  category: string
  location: string
  date: string
  image: string
  matchScore?: number
  description: string
}

interface SearchContextType {
  results: SearchResult[]
  isLoading: boolean
  search: (query: string, filters: SearchFilters) => Promise<void>
  getMatches: (listingId: string) => Promise<SearchResult[]>
  clearResults: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const mockListings: SearchResult[] = [
    {
      id: "1",
      title: "Silver Wedding Ring",
      type: "lost",
      category: "Jewelry",
      location: "Thamel, Kathmandu",
      date: "2025-12-01",
      image: "/placeholder.svg?key=2s1np",
      description: "Lost near Swayambhunath. Gold band with small diamond.",
    },
    {
      id: "2",
      title: "Black Backpack",
      type: "found",
      category: "Bags",
      location: "Pokhara City Center",
      date: "2025-11-28",
      image: "/placeholder.svg?key=qnsu2",
      description: "Found with university textbooks inside",
    },
    {
      id: "3",
      title: "Cat - Orange Tabby",
      type: "lost",
      category: "Pets",
      location: "Bhaktapur",
      date: "2025-11-25",
      image: "/placeholder.svg?key=wjda7",
      description: "Missing since last week. Very friendly.",
    },
    {
      id: "4",
      title: "Gold Watch",
      type: "lost",
      category: "Jewelry",
      location: "Kathmandu",
      date: "2025-11-20",
      image: "/placeholder.svg?key=kmnop",
      description: "Rolex watch, lost at shopping mall.",
    },
    {
      id: "5",
      title: "Blue Wallet",
      type: "found",
      category: "Wallet/Cards",
      location: "Thamel, Kathmandu",
      date: "2025-11-18",
      image: "/placeholder.svg?key=qrstu",
      description: "Found on main street, leather wallet.",
    },
  ]

  const calculateMatchScore = useCallback((listing: SearchResult, query: string, filters: SearchFilters) => {
    let score = 0

    // Title/description match
    const queryLower = query.toLowerCase()
    if (listing.title.toLowerCase().includes(queryLower)) score += 30
    if (listing.description.toLowerCase().includes(queryLower)) score += 20

    // Category match
    if (filters.category && listing.category.toLowerCase() === filters.category.toLowerCase()) {
      score += 25
    }

    // Type match
    if (filters.type && listing.type === filters.type) score += 15

    // Location match (simplified)
    if (filters.location && listing.location.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 20
    }

    return score
  }, [])

  const search = async (query: string, filters: SearchFilters) => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      const filtered = mockListings.filter((listing) => {
        const queryLower = query.toLowerCase()
        const matchesQuery =
          listing.title.toLowerCase().includes(queryLower) ||
          listing.description.toLowerCase().includes(queryLower) ||
          listing.category.toLowerCase().includes(queryLower)

        const matchesType = !filters.type || listing.type === filters.type
        const matchesCategory = !filters.category || listing.category.toLowerCase() === filters.category.toLowerCase()
        const matchesLocation =
          !filters.location || listing.location.toLowerCase().includes(filters.location.toLowerCase())

        return matchesQuery && matchesType && matchesCategory && matchesLocation
      })

      // Add match scores
      const withScores = filtered.map((listing) => ({
        ...listing,
        matchScore: calculateMatchScore(listing, query, filters),
      }))

      // Sort by filter preference
      if (filters.sortBy === "recent") {
        withScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      } else if (filters.sortBy === "relevant") {
        withScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      } else if (filters.sortBy === "popular") {
        withScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      }

      setResults(withScores)
    } finally {
      setIsLoading(false)
    }
  }

  const getMatches = async (listingId: string) => {
    setIsLoading(true)
    try {
      const listing = mockListings.find((l) => l.id === listingId)
      if (!listing) return []

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Find similar listings (opposite type, same category, nearby location)
      const matches = mockListings
        .filter((l) => l.id !== listingId && l.type !== listing.type && l.category === listing.category)
        .map((l) => ({
          ...l,
          matchScore: calculateMatchScore(l, listing.title, { category: listing.category }),
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 5)

      return matches
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <SearchContext.Provider value={{ results, isLoading, search, getMatches, clearResults }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
