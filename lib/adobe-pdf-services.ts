// Temporarily commented out due to SDK compatibility issues
// import {
//   PDFServices,
//   MimeType,
//   FillPDFJob,
//   FillPDFParams,
//   FillPDFResult,
//   PDFServicesCredentials,
//   SDKError
// } from '@adobe/pdfservices-node-sdk';

export interface PDFFormData {
  [fieldName: string]: string | number | boolean;
}

export interface GeneratePDFOptions {
  templatePath: string;
  formData: PDFFormData;
  outputFileName?: string;
}

class AdobePDFService {
  constructor() {
    // Mock implementation - credentials not needed for testing
    console.log('AdobePDFService initialized in mock mode');
  }

  /**
   * Fill a PDF form with provided data (Mock Implementation)
   */
  async fillPDFForm(options: GeneratePDFOptions): Promise<Buffer> {
    try {
      console.log(`[MOCK] Starting PDF generation for template: ${options.templatePath}`);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mock PDF content with form data
      const pdfContent = this.generateMockPDFContent(options.formData, options.templatePath);

      console.log('[MOCK] PDF generation completed successfully');

      return Buffer.from(pdfContent, 'base64');

    } catch (error) {
      console.error('Mock PDF Services error:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate mock PDF content as base64 string
   */
  private generateMockPDFContent(formData: PDFFormData, templatePath: string): string {
    // This is a minimal PDF structure in base64 format
    // In a real implementation, you would use the actual Adobe PDF SDK
    const formType = templatePath.split('/').pop()?.replace('.pdf', '') || 'form';
    const mockPdfBase64 = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPJ4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCAyNzYKPj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMCA3MjAgVGQKKE1vY2sgQ2FsaWZvcm5pYSBHdWFyZGlhbnNoaXAgRm9ybSkgVGoKMCAtNTAgVGQKKEZvcm0gVHlwZTogJyArIGZvcm1UeXBlICsgJykgVGoKMCAtNTAgVGQKKEdlbmVyYXRlZCBmb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5KSBUagpFVApPbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDc5IDAwMDAwIG4gCjAwMDAwMDAxNzMgMDAwMDAgbiAKMDAwMDAwMDMwMSAwMDAwMCBuIAowMDAwMDAwMzgwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNjU2CiUlRU9G';

    return mockPdfBase64;
  }

  /**
   * Generate multiple PDFs for California guardianship forms
   */
  async generateGuardianshipForms(caseData: any): Promise<{ [formType: string]: Buffer }> {
    const forms: { [formType: string]: Buffer } = {};

    try {
      // Map case data to different form types
      const formMappings = this.mapCaseDataToForms(caseData);

      // Generate each form
      for (const [formType, mapping] of Object.entries(formMappings)) {
        const templatePath = `./public/templates/${formType}.pdf`;

        try {
          forms[formType] = await this.fillPDFForm({
            templatePath,
            formData: mapping,
            outputFileName: `${formType}_${caseData.id}.pdf`
          });

          console.log(`Generated ${formType} successfully`);
        } catch (error) {
          console.error(`Failed to generate ${formType}:`, error);
          // Continue with other forms even if one fails
        }
      }

      return forms;

    } catch (error) {
      console.error('Error generating guardianship forms:', error);
      throw error;
    }
  }

  /**
   * Map case data to California form field requirements
   */
  private mapCaseDataToForms(caseData: any): { [formType: string]: PDFFormData } {
    const formData = caseData.form_data || {};

    return {
      'GC-210': {
        // Petition for Appointment of Guardian
        'minor_name': formData.minor_name || '',
        'minor_dob': formData.minor_dob || '',
        'minor_gender': formData.minor_gender || '',
        'minor_address': formData.minor_address || '',
        'minor_city': formData.minor_city || '',
        'minor_state': formData.minor_state || 'CA',
        'minor_zip': formData.minor_zip || '',
        'guardian_name': formData.guardian_name || '',
        'guardian_relationship': formData.guardian_relationship || '',
        'guardian_address': formData.guardian_address || '',
        'guardian_city': formData.guardian_city || '',
        'guardian_state': formData.guardian_state || 'CA',
        'guardian_zip': formData.guardian_zip || '',
        'guardian_phone': formData.guardian_phone || '',
      },

      'GC-220': {
        // SIJS Petition
        'minor_name': formData.minor_name || '',
        'minor_dob': formData.minor_dob || '',
        'minor_current_country': formData.minor_current_country || 'United States',
        'sijs_best_interest_explanation': formData.sijs_best_interest_explanation || '',
        'mother_reunification': formData.mother_reunification || '',
        'father_reunification': formData.father_reunification || '',
        'mother_reunification_explanation': formData.mother_reunification_explanation || '',
        'father_reunification_explanation': formData.father_reunification_explanation || '',
        'sijs_harm_explanation': formData.sijs_harm_explanation || '',
      },

      'GC-210CA': {
        // Child Information Attachment
        'minor_name': formData.minor_name || '',
        'minor_dob': formData.minor_dob || '',
        'minor_birthplace': formData.minor_birthplace || '',
        'minor_previous_addresses': JSON.stringify(formData.minor_previous_addresses || []),
        'is_citizen': formData.is_citizen === true ? 'Yes' : 'No',
        'immigration_status': formData.immigration_status || '',
        'a_number': formData.a_number || '',
        'minor_school': formData.minor_school || '',
        'grade_level': formData.grade_level || '',
      },

      'FL-105': {
        // UCCJEA Declaration
        'minor_name': formData.minor_name || '',
        'minor_current_address': `${formData.minor_address || ''}, ${formData.minor_city || ''}, ${formData.minor_state || 'CA'} ${formData.minor_zip || ''}`,
        'residence_duration': formData.residence_duration || '',
        'previous_addresses': JSON.stringify(formData.minor_previous_addresses || []),
        'other_court_cases': formData.other_court_cases || 'None',
        'domestic_violence': formData.domestic_violence || 'None',
      },

      'GC-020': {
        // Notice of Hearing
        'court_name': 'Superior Court of California, County of Alameda',
        'court_address': '1225 Fallon Street, Oakland, CA 94612',
        'case_number': '',
        'minor_name': formData.minor_name || '',
        'hearing_date': '',
        'hearing_time': '',
        'department': '',
        'petitioner_name': formData.guardian_name || '',
      }
    };
  }

  /**
   * Validate Adobe credentials
   */
  static validateCredentials(): boolean {
    const clientId = process.env.ADOBE_CLIENT_ID;
    const clientSecret = process.env.ADOBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Adobe PDF Services credentials not found. Please set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET environment variables.');
      return false;
    }

    if (clientId === 'your_adobe_client_id_here' || clientSecret === 'your_adobe_client_secret_here') {
      console.error('Adobe PDF Services credentials not configured. Please update environment variables with actual values.');
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const adobePDFService = new AdobePDFService();

// Form type definitions for California guardianship
export const CALIFORNIA_FORMS = {
  'GC-210': 'Petition for Appointment of Guardian',
  'GC-220': 'SIJS Petition',
  'GC-210CA': 'Child Information Attachment',
  'FL-105': 'UCCJEA Declaration',
  'GC-020': 'Notice of Hearing'
} as const;

export type CaliforniaFormType = keyof typeof CALIFORNIA_FORMS;