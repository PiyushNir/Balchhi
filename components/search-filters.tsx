"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SearchFilters } from "@/contexts/search-context"
import { Filter, X } from "lucide-react"

const filterSchema = z.object({
  type: z.enum(["lost", "found", "all"]).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  sortBy: z.enum(["recent", "relevant", "popular"]).optional(),
})

type FilterFormValues = z.infer<typeof filterSchema>

interface SearchFiltersProps {
  onFilter: (filters: SearchFilters) => void
  isLoading: boolean
}

const categories = [
  "All",
  "Jewelry",
  "Phone/Electronics",
  "Wallet/Cards",
  "Keys",
  "Bag/Backpack",
  "Documents",
  "Pet",
  "Clothing",
  "Other",
]

export default function SearchFiltersComponent({ onFilter, isLoading }: SearchFiltersProps) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      type: "all",
      category: "All",
      location: "",
      sortBy: "relevant",
    },
  })

  function onSubmit(values: FilterFormValues) {
    const filters: SearchFilters = {
      type: values.type && values.type !== "all" ? (values.type as "lost" | "found") : undefined,
      category: values.category && values.category !== "All" ? values.category : undefined,
      location: values.location || undefined,
      sortBy: (values.sortBy as "recent" | "relevant" | "popular") || "relevant",
    }
    onFilter(filters)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5 bg-white rounded-xl shadow-md border-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2B2B2B]/10 flex items-center justify-center">
            <Filter className="w-4 h-4 text-[#2B2B2B]/70" />
          </div>
          <h3 className="font-semibold text-[#2B2B2B]">Filters</h3>
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-[#2B2B2B] font-medium">Item Type</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2">
                  <label 
                    htmlFor="all" 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      field.value === 'all' ? 'bg-[#2B2B2B]/5 border border-[#2B2B2B]' : 'border border-transparent hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <RadioGroupItem value="all" id="all" className="border-[#2B2B2B] text-[#2B2B2B]" />
                    <span className="text-sm text-[#2B2B2B]">All Items</span>
                  </label>
                  <label 
                    htmlFor="lost" 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      field.value === 'lost' ? 'bg-red-50 border border-red-300' : 'border border-transparent hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <RadioGroupItem value="lost" id="lost" className="border-red-500 text-red-500" />
                    <span className="text-sm text-[#2B2B2B]">Lost</span>
                  </label>
                  <label 
                    htmlFor="found" 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      field.value === 'found' ? 'bg-green-50 border border-green-300' : 'border border-transparent hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <RadioGroupItem value="found" id="found" className="border-green-500 text-green-500" />
                    <span className="text-sm text-[#2B2B2B]">Found</span>
                  </label>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-[#2B2B2B] font-medium">Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-10 border-[#D4D4D4] text-[#2B2B2B] focus:border-[#2B2B2B]">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="border-[#D4D4D4]">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-[#2B2B2B] focus:bg-[#2B2B2B]/5">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-[#2B2B2B] font-medium">Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Kathmandu, Pokhara..." 
                  {...field} 
                  className="h-10 border-[#D4D4D4] text-[#2B2B2B] placeholder:text-[#2B2B2B]/40 focus:border-[#2B2B2B]" 
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-[#2B2B2B] font-medium">Sort By</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-10 border-[#D4D4D4] text-[#2B2B2B] focus:border-[#2B2B2B]">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="border-[#D4D4D4]">
                  <SelectItem value="relevant" className="text-[#2B2B2B] focus:bg-[#2B2B2B]/5">Most Relevant</SelectItem>
                  <SelectItem value="recent" className="text-[#2B2B2B] focus:bg-[#2B2B2B]/5">Most Recent</SelectItem>
                  <SelectItem value="popular" className="text-[#2B2B2B] focus:bg-[#2B2B2B]/5">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="flex-1 bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white"
          >
            {isLoading ? "Searching..." : "Apply Filters"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={() => form.reset()}
            className="border-[#D4D4D4] text-[#2B2B2B] hover:bg-[#F5F5F5]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  )
}

