import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Entrada</h1>
        <p className="mt-2 text-lg text-gray-600">
          Generate California SIJS guardianship forms quickly and accurately
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <Link href="/dashboard">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />
            Start New Case
          </Button>
        </Link>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multi-Step Interview</CardTitle>
            <CardDescription>
              Guided form collection with auto-save on every field
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Progressive disclosure reduces overwhelming 122 fields to 3-5 visible at a time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Auto-Save Everything</CardTitle>
            <CardDescription>
              Never lose data with 2-second auto-save
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Resume any case from the dashboard. Perfect for interrupted legal intake sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate All Forms</CardTitle>
            <CardDescription>
              One-click PDF generation for all required forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              GC-210, GC-220, FL-105, and more. Ready for court filing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Professional legal form automation for California guardianship cases.
        </p>
      </div>
    </div>
  );
}