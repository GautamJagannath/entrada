"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, FileText, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserCases, createCase, formatRelativeTime, getStatusConfig, searchCases } from "@/lib/cases";
import { useAuth } from "@/lib/auth";
import type { Case } from "@/lib/supabase";
import { toast } from "sonner";

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Dashboard: No user found, redirecting to login');
      router.replace('/login');
      return;
    } else if (user) {
      console.log('Dashboard: User authenticated:', user.email);
    }
  }, [user, authLoading, router]);

  // Load cases when user is authenticated
  useEffect(() => {
    if (user?.email) {
      loadCases();
    }
  }, [user?.email]);

  const loadCases = async () => {
    if (!user?.email) return;

    try {
      const userCases = await getUserCases(user.email);
      setCases(userCases);
    } catch (error) {
      console.error('Failed to load cases:', error);
      toast.error('Failed to load cases. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!user?.email) return;

    setCreating(true);
    try {
      const newCase = await createCase({
        user_email: user.email,
        initial_data: {}
      });

      toast.success('New case created successfully!');

      // Navigate to the new case
      window.location.href = `/interview/${newCase.id}`;
    } catch (error) {
      console.error('Failed to create case:', error);
      toast.error('Failed to create new case. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleGeneratePDF = async (caseItem: Case) => {
    setGeneratingPDF(caseItem.id);

    try {
      toast.loading('Generating PDF forms...', { id: 'pdf-generation' });

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caseId: caseItem.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'PDF generation failed');
      }

      const result = await response.json();

      toast.success(`Generated ${Object.keys(result.forms).length} PDF forms!`, {
        id: 'pdf-generation',
        description: 'Click to download individual forms',
        action: {
          label: 'Download',
          onClick: () => downloadPDFs(result.forms)
        }
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDFs', {
        id: 'pdf-generation'
      });
    } finally {
      setGeneratingPDF(null);
    }
  };

  const downloadPDFs = async (forms: { [key: string]: { name: string; data: string } }) => {
    for (const [formType, formData] of Object.entries(forms)) {
      try {
        console.log(`Downloading ${formType}: ${formData.name}`);
        console.log(`Base64 length: ${formData.data.length}`);

        // Convert base64 to blob
        const binaryString = atob(formData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        console.log(`Binary length: ${bytes.length}`);

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        console.log(`Blob size: ${blob.size}`);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = formData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(url);

        console.log(`✓ Downloaded ${formType}`);

        // Wait 500ms between downloads to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error downloading ${formType}:`, error);
      }
    }
  };

  const filteredCases = searchCases(cases, searchTerm);

  // Show loading while authenticating
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Cases</h1>
          <p className="text-gray-600">Manage and track guardianship cases</p>
        </div>
        <Button
          onClick={handleCreateCase}
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {creating ? 'Creating...' : 'New Case'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by minor name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your cases...</p>
            </CardContent>
          </Card>
        ) : filteredCases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No cases found" : "No cases yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No cases match your search." : "Get started by creating your first guardianship case."}
              </p>
              <Button onClick={handleCreateCase} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {creating ? 'Creating...' : 'Create First Case'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => {
            const statusConfig = getStatusConfig(caseItem.completion_percentage, caseItem.status);

            return (
              <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {caseItem.minor_name || 'Unnamed Minor'}
                        </h3>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.text}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {formatRelativeTime(caseItem.updated_at)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{caseItem.completion_percentage}%</span>
                        </div>
                        <Progress
                          value={caseItem.completion_percentage}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="ml-4">
                      {caseItem.status === "ready" || caseItem.completion_percentage === 100 ? (
                        <Button
                          onClick={() => handleGeneratePDF(caseItem)}
                          disabled={generatingPDF === caseItem.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {generatingPDF === caseItem.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          {generatingPDF === caseItem.id ? 'Generating...' : 'Generate PDFs'}
                        </Button>
                      ) : (
                        <Link href={`/interview/${caseItem.id}`}>
                          <Button variant="outline">
                            Resume
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}