"use client";

import { useState, useEffect, use } from "react";
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
import { useAuth } from "@/lib/auth";
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

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<Case | null>(null);

  const { id: caseId } = use(params);
  const { user } = useAuth();

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
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              All Cases
            </Button>
          </Link>
          <div className="flex items-center text-sm text-gray-500">
            <span>Editing Case:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formData.minor_name || 'Unnamed Minor'}
            </span>
          </div>
        </div>

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
              <span className="text-gray-600">Auto-saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <div className="h-2 w-2 bg-red-500 rounded-full" />
              <span className="text-red-600">Save failed</span>
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

          {/* Guardian Information Section */}
          {currentSection === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guardian_name">Guardian's Full Legal Name *</Label>
                  <Input
                    id="guardian_name"
                    value={formData.guardian_name || ''}
                    onChange={(e) => updateField('guardian_name', e.target.value)}
                    placeholder="Full legal name of proposed guardian"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardian_relationship">Relationship to Minor *</Label>
                    <Select
                      value={formData.guardian_relationship || ''}
                      onValueChange={(value) => updateField('guardian_relationship', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grandmother">Grandmother</SelectItem>
                        <SelectItem value="grandfather">Grandfather</SelectItem>
                        <SelectItem value="aunt">Aunt</SelectItem>
                        <SelectItem value="uncle">Uncle</SelectItem>
                        <SelectItem value="family_friend">Family Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="guardian_age">Guardian's Age</Label>
                    <Input
                      id="guardian_age"
                      type="number"
                      value={formData.guardian_age || ''}
                      onChange={(e) => updateField('guardian_age', e.target.value)}
                      placeholder="Age"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guardian_address">Guardian's Current Address *</Label>
                  <Input
                    id="guardian_address"
                    value={formData.guardian_address || ''}
                    onChange={(e) => updateField('guardian_address', e.target.value)}
                    placeholder="Street address"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="guardian_city">City *</Label>
                    <Input
                      id="guardian_city"
                      value={formData.guardian_city || ''}
                      onChange={(e) => updateField('guardian_city', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardian_state">State *</Label>
                    <Select
                      value={formData.guardian_state || 'CA'}
                      onValueChange={(value) => updateField('guardian_state', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="other">Other State</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="guardian_zip">ZIP Code *</Label>
                    <Input
                      id="guardian_zip"
                      value={formData.guardian_zip || ''}
                      onChange={(e) => updateField('guardian_zip', e.target.value)}
                      placeholder="12345"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardian_phone">Phone Number</Label>
                    <Input
                      id="guardian_phone"
                      type="tel"
                      value={formData.guardian_phone || ''}
                      onChange={(e) => updateField('guardian_phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardian_email">Email Address</Label>
                    <Input
                      id="guardian_email"
                      type="email"
                      value={formData.guardian_email || ''}
                      onChange={(e) => updateField('guardian_email', e.target.value)}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>How long has guardian known the minor? *</Label>
                  <RadioGroup
                    value={formData.guardian_known_duration || ''}
                    onValueChange={(value) => updateField('guardian_known_duration', value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="birth" id="known-birth" />
                      <Label htmlFor="known-birth">Since birth</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="years" id="known-years" />
                      <Label htmlFor="known-years">Several years</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recent" id="known-recent" />
                      <Label htmlFor="known-recent">Recently</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Guardian's employment status</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="guardian_occupation">Occupation</Label>
                      <Input
                        id="guardian_occupation"
                        value={formData.guardian_occupation || ''}
                        onChange={(e) => updateField('guardian_occupation', e.target.value)}
                        placeholder="Job title"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardian_employer">Employer</Label>
                      <Input
                        id="guardian_employer"
                        value={formData.guardian_employer || ''}
                        onChange={(e) => updateField('guardian_employer', e.target.value)}
                        placeholder="Company name"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parent 1 (Mother) Information Section */}
          {currentSection === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mother_name">Mother's Full Legal Name (including maiden name) *</Label>
                  <Input
                    id="mother_name"
                    value={formData.mother_name || ''}
                    onChange={(e) => updateField('mother_name', e.target.value)}
                    placeholder="Full legal name and maiden name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Is mother living? *</Label>
                  <RadioGroup
                    value={formData.mother_living || ''}
                    onValueChange={(value) => updateField('mother_living', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="mother-living-yes" />
                      <Label htmlFor="mother-living-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="mother-living-no" />
                      <Label htmlFor="mother-living-no">No (Deceased)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unknown" id="mother-living-unknown" />
                      <Label htmlFor="mother-living-unknown">Unknown</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.mother_living === 'no' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-red-200 ml-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mother_death_date">Date of Death</Label>
                        <Input
                          id="mother_death_date"
                          type="date"
                          value={formData.mother_death_date || ''}
                          onChange={(e) => updateField('mother_death_date', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mother_death_place">Place of Death</Label>
                        <Input
                          id="mother_death_place"
                          value={formData.mother_death_place || ''}
                          onChange={(e) => updateField('mother_death_place', e.target.value)}
                          placeholder="City, State/Country"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="mother_last_address">Mother's Last Known Address</Label>
                  <Input
                    id="mother_last_address"
                    value={formData.mother_last_address || ''}
                    onChange={(e) => updateField('mother_last_address', e.target.value)}
                    placeholder="Street address, City, State/Country"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Does mother agree to guardianship?</Label>
                  <RadioGroup
                    value={formData.mother_agrees || ''}
                    onValueChange={(value) => updateField('mother_agrees', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="mother-agrees-yes" />
                      <Label htmlFor="mother-agrees-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="mother-agrees-no" />
                      <Label htmlFor="mother-agrees-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unknown" id="mother-agrees-unknown" />
                      <Label htmlFor="mother-agrees-unknown">Unknown</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Can minor be reunified with mother? (Important for SIJS) *</Label>
                  <RadioGroup
                    value={formData.mother_reunification || ''}
                    onValueChange={(value) => updateField('mother_reunification', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="mother-reunify-no" />
                      <Label htmlFor="mother-reunify-no">No - Not viable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="mother-reunify-yes" />
                      <Label htmlFor="mother-reunify-yes">Yes - Possible</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.mother_reunification === 'no' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-blue-200 ml-4">
                    <div>
                      <Label>Why can't minor reunify with mother? (Check all that apply)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.mother_abandonment || false}
                            onChange={(e) => updateField('mother_abandonment', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Abandonment</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.mother_abuse || false}
                            onChange={(e) => updateField('mother_abuse', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Abuse</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.mother_neglect || false}
                            onChange={(e) => updateField('mother_neglect', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Neglect</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.mother_other_basis || false}
                            onChange={(e) => updateField('mother_other_basis', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Other similar basis</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="mother_reunification_explanation">Detailed explanation of why reunification is not viable *</Label>
                      <textarea
                        id="mother_reunification_explanation"
                        value={formData.mother_reunification_explanation || ''}
                        onChange={(e) => updateField('mother_reunification_explanation', e.target.value)}
                        placeholder="Provide specific details about the circumstances that make reunification not viable..."
                        className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="mother_last_contact">When did mother last have contact with minor?</Label>
                  <Input
                    id="mother_last_contact"
                    value={formData.mother_last_contact || ''}
                    onChange={(e) => updateField('mother_last_contact', e.target.value)}
                    placeholder="e.g., 'January 2020' or 'Never' or 'Unknown'"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Parent 2 (Father) Information Section */}
          {currentSection === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="father_name">Father's Full Legal Name *</Label>
                  <Input
                    id="father_name"
                    value={formData.father_name || ''}
                    onChange={(e) => updateField('father_name', e.target.value)}
                    placeholder="Full legal name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Is father living? *</Label>
                  <RadioGroup
                    value={formData.father_living || ''}
                    onValueChange={(value) => updateField('father_living', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="father-living-yes" />
                      <Label htmlFor="father-living-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="father-living-no" />
                      <Label htmlFor="father-living-no">No (Deceased)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unknown" id="father-living-unknown" />
                      <Label htmlFor="father-living-unknown">Unknown</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.father_living === 'no' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-red-200 ml-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="father_death_date">Date of Death</Label>
                        <Input
                          id="father_death_date"
                          type="date"
                          value={formData.father_death_date || ''}
                          onChange={(e) => updateField('father_death_date', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="father_death_place">Place of Death</Label>
                        <Input
                          id="father_death_place"
                          value={formData.father_death_place || ''}
                          onChange={(e) => updateField('father_death_place', e.target.value)}
                          placeholder="City, State/Country"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="father_last_address">Father's Last Known Address</Label>
                  <Input
                    id="father_last_address"
                    value={formData.father_last_address || ''}
                    onChange={(e) => updateField('father_last_address', e.target.value)}
                    placeholder="Street address, City, State/Country"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Does father agree to guardianship?</Label>
                  <RadioGroup
                    value={formData.father_agrees || ''}
                    onValueChange={(value) => updateField('father_agrees', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="father-agrees-yes" />
                      <Label htmlFor="father-agrees-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="father-agrees-no" />
                      <Label htmlFor="father-agrees-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unknown" id="father-agrees-unknown" />
                      <Label htmlFor="father-agrees-unknown">Unknown</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Can minor be reunified with father? (Important for SIJS) *</Label>
                  <RadioGroup
                    value={formData.father_reunification || ''}
                    onValueChange={(value) => updateField('father_reunification', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="father-reunify-no" />
                      <Label htmlFor="father-reunify-no">No - Not viable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="father-reunify-yes" />
                      <Label htmlFor="father-reunify-yes">Yes - Possible</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.father_reunification === 'no' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-blue-200 ml-4">
                    <div>
                      <Label>Why can't minor reunify with father? (Check all that apply)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.father_abandonment || false}
                            onChange={(e) => updateField('father_abandonment', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Abandonment</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.father_abuse || false}
                            onChange={(e) => updateField('father_abuse', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Abuse</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.father_neglect || false}
                            onChange={(e) => updateField('father_neglect', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Neglect</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.father_other_basis || false}
                            onChange={(e) => updateField('father_other_basis', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Other similar basis</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="father_reunification_explanation">Detailed explanation of why reunification is not viable *</Label>
                      <textarea
                        id="father_reunification_explanation"
                        value={formData.father_reunification_explanation || ''}
                        onChange={(e) => updateField('father_reunification_explanation', e.target.value)}
                        placeholder="Provide specific details about the circumstances that make reunification not viable..."
                        className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="father_last_contact">When did father last have contact with minor?</Label>
                  <Input
                    id="father_last_contact"
                    value={formData.father_last_contact || ''}
                    onChange={(e) => updateField('father_last_contact', e.target.value)}
                    placeholder="e.g., 'January 2020' or 'Never' or 'Unknown'"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Are parents married to each other?</Label>
                  <RadioGroup
                    value={formData.parents_married || ''}
                    onValueChange={(value) => updateField('parents_married', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="parents-married-yes" />
                      <Label htmlFor="parents-married-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="parents-married-no" />
                      <Label htmlFor="parents-married-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="divorced" id="parents-married-divorced" />
                      <Label htmlFor="parents-married-divorced">Divorced</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* SIJS Factors Section */}
          {currentSection === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Special Immigrant Juvenile Status (SIJS)</h4>
                <p className="text-sm text-blue-700">
                  These questions help establish eligibility for SIJS, which can lead to a green card for the minor.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Is it in the minor's best interest to remain in the United States? *</Label>
                  <RadioGroup
                    value={formData.sijs_best_interest || ''}
                    onValueChange={(value) => updateField('sijs_best_interest', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="best-interest-yes" />
                      <Label htmlFor="best-interest-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="best-interest-no" />
                      <Label htmlFor="best-interest-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.sijs_best_interest === 'yes' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-green-200 ml-4">
                    <div>
                      <Label htmlFor="best_interest_explanation">Explain why remaining in the US is in the minor's best interest *</Label>
                      <textarea
                        id="best_interest_explanation"
                        value={formData.best_interest_explanation || ''}
                        onChange={(e) => updateField('best_interest_explanation', e.target.value)}
                        placeholder="Consider factors like: educational opportunities, medical care, family relationships, safety, language, community ties..."
                        className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Would returning the minor to their home country be harmful? *</Label>
                  <RadioGroup
                    value={formData.return_harmful || ''}
                    onValueChange={(value) => updateField('return_harmful', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="return-harmful-yes" />
                      <Label htmlFor="return-harmful-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="return-harmful-no" />
                      <Label htmlFor="return-harmful-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.return_harmful === 'yes' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-red-200 ml-4">
                    <div>
                      <Label htmlFor="return_harmful_explanation">Describe the potential harm if minor is returned *</Label>
                      <textarea
                        id="return_harmful_explanation"
                        value={formData.return_harmful_explanation || ''}
                        onChange={(e) => updateField('return_harmful_explanation', e.target.value)}
                        placeholder="Consider: lack of family support, poverty, violence, lack of educational/medical opportunities, persecution..."
                        className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Has the minor been declared dependent on a juvenile court?</Label>
                  <RadioGroup
                    value={formData.juvenile_court_dependent || ''}
                    onValueChange={(value) => updateField('juvenile_court_dependent', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="dependent-yes" />
                      <Label htmlFor="dependent-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="dependent-no" />
                      <Label htmlFor="dependent-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Has the minor suffered trauma or abuse?</Label>
                  <RadioGroup
                    value={formData.minor_trauma || ''}
                    onValueChange={(value) => updateField('minor_trauma', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="trauma-yes" />
                      <Label htmlFor="trauma-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="trauma-no" />
                      <Label htmlFor="trauma-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.minor_trauma === 'yes' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-orange-200 ml-4">
                    <div>
                      <Label htmlFor="trauma_description">Describe the trauma or abuse (if comfortable sharing)</Label>
                      <textarea
                        id="trauma_description"
                        value={formData.trauma_description || ''}
                        onChange={(e) => updateField('trauma_description', e.target.value)}
                        placeholder="General description (specific details not required for this form)"
                        className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label>Is the minor receiving counseling or therapy?</Label>
                      <RadioGroup
                        value={formData.minor_counseling || ''}
                        onValueChange={(value) => updateField('minor_counseling', value)}
                        className="flex gap-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="counseling-yes" />
                          <Label htmlFor="counseling-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="counseling-no" />
                          <Label htmlFor="counseling-no">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="needed" id="counseling-needed" />
                          <Label htmlFor="counseling-needed">Needed</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="family_ties_us">Family/community ties in the United States</Label>
                  <textarea
                    id="family_ties_us"
                    value={formData.family_ties_us || ''}
                    onChange={(e) => updateField('family_ties_us', e.target.value)}
                    placeholder="Describe family members, friends, community connections, school relationships..."
                    className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Court Information Section */}
          {currentSection === 5 && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-purple-900 mb-2">Court Filing Information</h4>
                <p className="text-sm text-purple-700">
                  Information about where and how to file the guardianship petition.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="filing_county">County where filing *</Label>
                  <Select
                    value={formData.filing_county || 'alameda'}
                    onValueChange={(value) => updateField('filing_county', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alameda">Alameda County</SelectItem>
                      <SelectItem value="contra-costa">Contra Costa County</SelectItem>
                      <SelectItem value="san-francisco">San Francisco County</SelectItem>
                      <SelectItem value="santa-clara">Santa Clara County</SelectItem>
                      <SelectItem value="other">Other County</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="courthouse_address">Specific courthouse address</Label>
                  <Input
                    id="courthouse_address"
                    value={formData.courthouse_address || ''}
                    onChange={(e) => updateField('courthouse_address', e.target.value)}
                    placeholder="Will be auto-filled based on county selection"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Is this an emergency filing?</Label>
                  <RadioGroup
                    value={formData.emergency_filing || ''}
                    onValueChange={(value) => updateField('emergency_filing', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="emergency-no" />
                      <Label htmlFor="emergency-no">No - Standard filing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="emergency-yes" />
                      <Label htmlFor="emergency-yes">Yes - Emergency</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.emergency_filing === 'yes' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-red-200 ml-4">
                    <div>
                      <Label htmlFor="emergency_reason">Reason for emergency filing *</Label>
                      <textarea
                        id="emergency_reason"
                        value={formData.emergency_reason || ''}
                        onChange={(e) => updateField('emergency_reason', e.target.value)}
                        placeholder="Explain why this is an emergency (e.g., immediate danger, medical needs, school enrollment)"
                        className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Will you need an interpreter at the hearing?</Label>
                  <RadioGroup
                    value={formData.interpreter_needed || ''}
                    onValueChange={(value) => updateField('interpreter_needed', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="interpreter-no" />
                      <Label htmlFor="interpreter-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="interpreter-yes" />
                      <Label htmlFor="interpreter-yes">Yes</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.interpreter_needed === 'yes' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4 pl-4 border-l-2 border-blue-200 ml-4">
                    <div>
                      <Label htmlFor="interpreter_language">What language? *</Label>
                      <Select
                        value={formData.interpreter_language || ''}
                        onValueChange={(value) => updateField('interpreter_language', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="mandarin">Mandarin</SelectItem>
                          <SelectItem value="vietnamese">Vietnamese</SelectItem>
                          <SelectItem value="tagalog">Tagalog</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="additional_info">Additional information for the court</Label>
                  <textarea
                    id="additional_info"
                    value={formData.additional_info || ''}
                    onChange={(e) => updateField('additional_info', e.target.value)}
                    placeholder="Any other relevant information you want the court to know"
                    className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg mt-6">
                  <h4 className="font-medium text-green-900 mb-2">Ready to Generate Forms</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Once you complete all sections, you'll be able to generate the California Judicial Council forms needed for your guardianship petition.
                  </p>
                  <div className="text-sm text-green-600">
                    <strong>Forms that will be generated:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>GC-210 - Petition for Appointment of Guardian</li>
                      <li>GC-210(CA) - Child Information Attachment</li>
                      <li>GC-212 - Confidential Guardian Screening Form</li>
                      <li>GC-220 - Order Appointing Guardian (SIJS)</li>
                      <li>FL-105/GC-120 - Declaration Under UCCJEA</li>
                      <li>GC-020 - Notice of Hearing</li>
                    </ul>
                  </div>
                </div>
              </div>
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