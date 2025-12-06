"use client"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, MessageCircle, Shield, Share2, Flag } from "lucide-react"
import ClaimItemDialog from "@/components/claim-item-dialog"
import { useAuth } from "@/contexts/auth-context"

export default function ListingDetailPage() {
  const params = useParams()
  const listingId = params.id
  const { user } = useAuth()

  const listing = {
    id: listingId,
    title: "Silver Wedding Ring",
    type: "lost",
    category: "Jewelry",
    location: "Thamel, Kathmandu",
    date: "2025-12-01",
    description: "Lost near Swayambhunath on Monday evening. Gold band with small diamond. Very sentimental value.",
    image: "/placeholder.svg?key=2s1np",
    status: "active",
    postedBy: "Ramesh Sharma",
    posterId: "user123",
    contact: "ramesh@example.com",
    views: 245,
  }

  const isOwner = user?.id === listing.posterId

  return (
    <main className="min-h-screen flex flex-col bg-[#FFFFFF]">
      <Header />

      <div className="flex-1 pt-24 pb-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-[#D4D4D4]/10 h-96 shadow-lg">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <Badge 
                  className={`absolute top-4 right-4 px-4 py-1.5 text-sm font-semibold ${
                    listing.type === "lost" 
                      ? "bg-red-500 text-white border-0" 
                      : "bg-[#2B2B2B] text-[#FFFFFF] border-0"
                  }`}
                >
                  {listing.type === "lost" ? "Lost Item" : "Found Item"}
                </Badge>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white text-[#2B2B2B]">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white text-[#2B2B2B]">
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-[#2B2B2B]">{listing.title}</CardTitle>
                      <CardDescription className="text-[#2B2B2B] mt-1">{listing.category}</CardDescription>
                    </div>
                    <span className="text-sm text-[#2B2B2B]">{listing.views} views</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#2B2B2B] leading-relaxed">{listing.description}</p>

                  <div className="space-y-3 pt-4 border-t border-[#FFFFFF]">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#D4D4D4]/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#2B2B2B]" />
                      </div>
                      <span className="text-[#2B2B2B]">{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#D4D4D4]/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[#2B2B2B]" />
                      </div>
                      <span className="text-[#2B2B2B]">{new Date(listing.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B]">Posted by</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-[#2B2B2B]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2B2B2B]">{listing.postedBy}</p>
                      <div className="flex items-center gap-1 text-xs text-[#2B2B2B]">
                        <Shield className="w-3 h-3" />
                        <span>Verified Member</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-[#2B2B2B] hover:bg-[#2B2B2B] text-[#FFFFFF]">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Poster
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B]">
                    {isOwner ? "Claims & Verification" : "Is this your item?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwner ? (
                    <div className="space-y-3">
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-[#D4D4D4]/20 flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-6 h-6 text-[#2B2B2B]" />
                        </div>
                        <p className="text-sm text-[#2B2B2B]">
                          No claims yet. We'll notify you when someone claims this item.
                        </p>
                      </div>
                      <Button variant="outline" className="w-full border-[#D4D4D4] text-[#2B2B2B]" disabled>
                        No Active Claims
                      </Button>
                    </div>
                  ) : (
                    <ClaimItemDialog listingId={listing.id as string} listingTitle={listing.title} />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#F5F5F5] border-[#D4D4D4] shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#2B2B2B] flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#2B2B2B]/70" />
                    Safety Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[#2B2B2B]/80">
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Meet in public, well-lit places
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Verify the item with specific details
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Never share personal info upfront
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#2B2B2B]">•</span>
                    Report suspicious activity
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
