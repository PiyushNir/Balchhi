"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Organization } from "@/contexts/organization-context"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Users, FileText, CheckCircle, TrendingUp } from "lucide-react"

interface OrgAnalyticsProps {
  organization: Organization
}

export default function OrgAnalytics({ organization }: OrgAnalyticsProps) {
  // Mock analytics data
  const monthlyData = [
    { month: "Jan", listings: 12, recovered: 8 },
    { month: "Feb", listings: 15, recovered: 10 },
    { month: "Mar", listings: 18, recovered: 14 },
    { month: "Apr", listings: 22, recovered: 18 },
    { month: "May", listings: 25, recovered: 20 },
    { month: "Jun", listings: 28, recovered: 23 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.listingsCount}</div>
            <p className="text-xs text-muted-foreground">Active on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.recoveredCount}</div>
            <p className="text-xs text-muted-foreground">Items reunited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.members.length}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.listingsCount > 0
                ? Math.round((organization.recoveredCount / organization.listingsCount) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Items recovered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Activity</CardTitle>
          <CardDescription>Listings posted and items recovered</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="listings" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="recovered" stroke="hsl(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
