"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SearchBarProps {
  variant?: "default" | "hero"
}

export default function SearchBar({ variant = "default" }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query)}`)
    }
  }

  if (variant === "hero") {
    return (
      <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2B2B2B]/40" />
          <Input
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-14 rounded-xl border-2 border-[#D4D4D4] bg-white/90 backdrop-blur text-[#2B2B2B] placeholder:text-[#2B2B2B]/40 focus:border-[#2B2B2B] focus:ring-[#2B2B2B]/30 text-lg"
          />
        </div>
        <Button 
          type="submit" 
          className="h-14 px-8 bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white rounded-xl font-semibold"
        >
          Search
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2B2B2B]/40" />
        <Input
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 border-[#D4D4D4] focus:border-[#2B2B2B] text-[#2B2B2B]"
        />
      </div>
      <Button type="submit" className="bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white">
        Search
      </Button>
    </form>
  )
}

