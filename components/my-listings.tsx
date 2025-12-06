"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Edit2, Trash2, Eye } from "lucide-react"

interface MyListingsProps {
  status: "active" | "closed" | "archived"
}

export default function MyListings({ status }: MyListingsProps) {
  const listings = [
    {
      id: 1,
      title: "Silver Wedding Ring",
      type: "lost",
      category: "Jewelry",
      location: "Thamel, Kathmandu",
      date: "2025-12-01",
      image: "/placeholder.svg?key=2s1np",
      views: 245,
    },
    {
      id: 2,
      title: "Black Backpack",
      type: "found",
      category: "Bags",
      location: "Pokhara City Center",
      date: "2025-11-28",
      image: "/placeholder.svg?key=qnsu2",
      views: 128,
    },
  ]

  if (listings.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#6db8bb]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#05647a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-[#10375d] font-medium mb-2">No {status} listings yet</p>
            <p className="text-[#869684] text-sm mb-4">Start by posting a lost or found item</p>
            <Link href="/listing/create">
              <Button className="bg-[#10375d] hover:bg-[#05647a] text-[#e0e2d5]">Create Your First Listing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="h-32 w-32 flex-shrink-0 bg-[#6db8bb]/10 rounded-xl overflow-hidden">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate text-[#10375d]">{listing.title}</h3>
                      <Badge 
                        className={`flex-shrink-0 ${
                          listing.type === "lost" 
                            ? "bg-red-100 text-red-700 border-0" 
                            : "bg-[#6db8bb]/30 text-[#05647a] border-0"
                        }`}
                      >
                        {listing.type === "lost" ? "Lost" : "Found"}
                      </Badge>
                    </div>

                    <p className="text-sm text-[#869684] mb-3">{listing.category}</p>

                    <div className="space-y-1 text-sm text-[#05647a]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(listing.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{listing.views} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/listing/${listing.id}`}>
                      <Button variant="outline" size="sm" className="border-[#6db8bb] text-[#05647a] hover:bg-[#6db8bb]/10">
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon" className="border-[#6db8bb] text-[#05647a] hover:bg-[#6db8bb]/10">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
