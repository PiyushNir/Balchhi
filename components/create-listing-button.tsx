"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function CreateListingButton() {
  const { user } = useAuth()
  const router = useRouter()

  const handleClick = () => {
    if (!user) {
      router.push("/login")
    }
  }

  return (
    <Link href={user ? "/listing/create" : "/login"} onClick={handleClick}>
      <Button className="bg-[#2B2B2B] hover:bg-[#2B2B2B] text-[#FFFFFF] font-semibold px-6 py-5 rounded-xl shadow-md transition-all hover:shadow-lg">
        <Plus className="w-5 h-5 mr-2" />
        Post Item
      </Button>
    </Link>
  )
}

