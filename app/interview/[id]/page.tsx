"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Save, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { getCase, updateCase, createCase } from "@/lib/cases";
import type { Case } from "@/lib/supabase";

const sections = [
  { id: 'minor', title: 'Minor Information', fields: 25, color: 'bg-blue-500' },
  { id: 'guardian', title: 'Guardian Information', fields: 15, color: 'bg-green-500' },
  { id: 'parent1', title: 'Parent 1', fields: 20, color: 'bg-purple-500' },
  { id: 'parent2', title: 'Parent 2', fields: 20, color: 'bg-orange-500' },
  { id: 'sijs', title: 'SIJS Factors', fields: 10, color: 'bg-red-500' },
  { id: 'court', title: 'Court Info', fields: 5, color: 'bg-gray-500' }
];

export default function InterviewPage({ params }: { params: { id: string } }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<Case | null>(null);

  const caseId = params.id;
  const userEmail = "demo@entrada.app"; // Mock user email

  // Load case data
  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      if (caseId === 'new') {
        // Create new case
        const newCase = await createCase({
          user_email: userEmail,
          initial_data: {}
        });
        setCaseData(newCase);
        setFormData(newCase.form_data);

        // Update URL to reflect the new case ID
        window.history.replaceState(null, '', `/interview/${newCase.id}`);
      } else {
        // Load existing case
        const existingCase = await getCase(caseId);
        if (!existingCase) {
          toast.error('Case not found');
          return;
        }
        setCaseData(existingCase);
        setFormData(existingCase.form_data);
      }
    } catch (error) {
      console.error('Failed to load case:', error);
      toast.error('Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  // Real auto-save hook
  const { saveNow } = useAutoSave({
    caseId: caseData?.id || '',
    formData,
    onStatusChange: setSaveStatus,
    debounceMs: 2000
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateProgress = () => {
    if (!caseData) return 0;
    return caseData.completion_percentage;
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      await saveNow();
      toast.success('Progress saved successfully!');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save progress');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading case data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Case not found</h2>
            <p className="text-gray-600 mb-4">The requested case could not be loaded.</p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <>
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-gray-600">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">All changes saved</span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {params.id === 'new' ? 'New' : 'Edit'} Guardianship Case
          </h1>
          <Badge variant="outline">{Math.round(calculateProgress())}% Complete</Badge>
        </div>

        {/* Section Progress */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((section, index) => (
            <Button
              key={section.id}
              variant={index === currentSection ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentSection(index)}
              className={`whitespace-nowrap ${index === currentSection ? currentSectionData.color : ''}`}
            >
              {section.title}
            </Button>
          ))}
        </div>

        <Progress value={calculateProgress()} className="w-full" />
      </div>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${currentSectionData.color}`} />
            {currentSectionData.title}
            <span className="text-sm font-normal text-gray-500">
              (Step {currentSection + 1} of {sections.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progressive Disclosure Example - Minor Information */}
          {currentSection === 0 && (
            <div className="space-y-6">
              {/* Always visible: Core info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="minor_name">Minor's Full Legal Name *</Label>
                  <Input
                    id="minor_name"
                    value={formData.minor_name || ''}
                    onChange={(e) => updateField('minor_name', e.target.value)}
                    placeholder="As it appears on birth certificate"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minor_dob">Date of Birth *</Label>
                    <Input
                      id="minor_dob"
                      type="date"
                      value={formData.minor_dob || ''}
                      onChange={(e) => updateField('minor_dob', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minor_gender">Gender *</Label>
                    <Select
                      value={formData.minor_gender || ''}
                      onValueChange={(value) => updateField('minor_gender', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="X">Non-binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Conditional: Only show if non-citizen */}
              <div className="space-y-4">
                <Label>Is the minor a US citizen? *</Label>
                <RadioGroup
                  value={formData.is_citizen || ''}
                  onValueChange={(value) => updateField('is_citizen', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="citizen-yes" />
                    <Label htmlFor="citizen-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="citizen-no" />
                    <Label htmlFor="citizen-no">No</Label>
                  </div>
                </RadioGroup>

                {formData.is_citizen === 'no' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-blue-200 ml-4">
                    <div>
                      <Label htmlFor="a_number">A-Number</Label>
                      <Input
                        id="a_number"
                        value={formData.a_number || ''}
                        onChange={(e) => updateField('a_number', e.target.value)}
                        placeholder="8 or 9 digits"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="immigration_status">Immigration Status</Label>
                      <Select
                        value={formData.immigration_status || ''}
                        onValueChange={(value) => updateField('immigration_status', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="undocumented">Undocumented</SelectItem>
                          <SelectItem value="visa">Visa holder</SelectItem>
                          <SelectItem value="asylum">Asylum pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="country_of_birth">Country of Birth</Label>
                      <Input
                        id="country_of_birth"
                        value={formData.country_of_birth || ''}
                        onChange={(e) => updateField('country_of_birth', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional: Only show if has siblings */}
              <div className="space-y-4">
                <Label>Does the minor have siblings?</Label>
                <RadioGroup
                  value={formData.has_siblings || ''}
                  onValueChange={(value) => updateField('has_siblings', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="siblings-no" />
                    <Label htmlFor="siblings-no">No siblings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="siblings-yes" />
                    <Label htmlFor="siblings-yes">Has siblings</Label>
                  </div>
                </RadioGroup>

                {formData.has_siblings === 'yes' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4">
                    <div>
                      <Label htmlFor="sibling_1_name">Sibling 1 - Name</Label>
                      <Input
                        id="sibling_1_name"
                        value={formData.sibling_1_name || ''}
                        onChange={(e) => updateField('sibling_1_name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="text-blue-600">
                      + Add another sibling
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other sections would be implemented similarly */}
          {currentSection > 0 && (
            <div className="text-center py-12 text-gray-500">
              <h3 className="text-lg font-medium mb-2">{currentSectionData.title}</h3>
              <p>This section is coming soon...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSection === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button variant="ghost" onClick={handleSaveAndExit} className="text-gray-600">
          <Save className="h-4 w-4 mr-2" />
          Save & Exit
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentSection === sections.length - 1}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}