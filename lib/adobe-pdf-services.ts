import {
  PDFServices,
  MimeType,
  FillPDFJob,
  FillPDFParams,
  FillPDFResult,
  PDFServicesCredentials,
  SDKError
} from '@adobe/pdfservices-node-sdk';

export interface PDFFormData {
  [fieldName: string]: string | number | boolean;
}

export interface GeneratePDFOptions {
  templatePath: string;
  formData: PDFFormData;
  outputFileName?: string;
}

class AdobePDFService {
  private credentials: PDFServicesCredentials;
  private pdfServices: PDFServices;

  constructor() {
    // Initialize credentials from environment variables
    this.credentials = new PDFServicesCredentials({
      clientId: process.env.ADOBE_CLIENT_ID!,
      clientSecret: process.env.ADOBE_CLIENT_SECRET!
    });

    this.pdfServices = new PDFServices({
      credentials: this.credentials
    });
  }

  /**
   * Fill a PDF form with provided data
   */
  async fillPDFForm(options: GeneratePDFOptions): Promise<Buffer> {
    try {
      console.log(`Starting PDF generation for template: ${options.templatePath}`);

      // Create FillPDF job
      const fillPDFJob: FillPDFJob = new FillPDFJob({
        inputAsset: await this.pdfServices.upload({
          readStream: require('fs').createReadStream(options.templatePath),
          mimeType: MimeType.PDF
        }),
        params: new FillPDFParams({
          jsonDataForMerge: options.formData
        })
      });

      // Submit the job
      const jobResult: FillPDFResult = await this.pdfServices.submit(fillPDFJob);

      // Download the result
      const resultAsset = jobResult.asset;
      const streamAsset = await this.pdfServices.getContent({ asset: resultAsset });

      console.log('PDF generation completed successfully');

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        streamAsset.readStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        streamAsset.readStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        streamAsset.readStream.on('error', (error: Error) => {
          console.error('Error reading PDF stream:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Adobe PDF Services error:', error);

      if (error instanceof SDKError) {
        throw new Error(`Adobe SDK Error: ${error.message}`);
      }

      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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