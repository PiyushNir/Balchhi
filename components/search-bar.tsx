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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#869684]" />
          <Input
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-14 rounded-xl border-2 border-[#e0e2d5]/50 bg-white/90 backdrop-blur text-[#10375d] placeholder:text-[#869684] focus:border-[#e0e2d5] focus:ring-[#e0e2d5]/30 text-lg"
          />
        </div>
        <Button 
          type="submit" 
          className="h-14 px-8 bg-[#10375d] hover:bg-[#05647a] text-[#e0e2d5] rounded-xl font-semibold"
        >
          Search
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#869684]" />
        <Input
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 border-[#6db8bb] focus:border-[#05647a] text-[#10375d]"
        />
      </div>
      <Button type="submit" className="bg-[#10375d] hover:bg-[#05647a] text-[#e0e2d5]">
        Search
      </Button>
    </form>
  )
}
