import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar } from "lucide-react"

interface Listing {
  id: number
  title: string
  type: "lost" | "found"
  category: string
  location: string
  date: string
  description: string
  image: string
  status: string
}

export default function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Link key={listing.id} href={`/listing/${listing.id}`}>
          <Card className="h-full hover:shadow-xl transition-all cursor-pointer overflow-hidden bg-white border-0 shadow-md group">
            <div className="relative h-48 bg-[#6db8bb]/10 overflow-hidden">
              <img
                src={listing.image || "/placeholder.svg"}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Badge 
                className={`absolute top-3 right-3 ${
                  listing.type === "lost" 
                    ? "bg-red-500 text-white border-0" 
                    : "bg-[#05647a] text-[#e0e2d5] border-0"
                }`}
              >
                {listing.type === "lost" ? "Lost" : "Found"}
              </Badge>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#10375d] group-hover:text-[#05647a] transition-colors">
                {listing.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs mt-1">
                <span className="inline-block bg-[#6db8bb]/20 text-[#05647a] px-2 py-1 rounded-md font-medium">
                  {listing.category}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-[#869684] mb-3 line-clamp-2">{listing.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#05647a]">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-2 text-[#869684]">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(listing.date).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
