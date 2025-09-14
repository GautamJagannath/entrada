import { PDFDocument, PDFForm } from 'pdf-lib';
import * as fs from 'fs';

export interface PDFFormData {
  [fieldName: string]: string | number | boolean;
}

export interface GeneratePDFOptions {
  templatePath: string;
  formData: PDFFormData;
  outputFileName?: string;
}

class CaliforniaPDFFormService {
  constructor() {
    console.log('California PDF Form Service initialized with pdf-lib');
  }

  /**
   * Fill a PDF form with provided data using pdf-lib
   */
  async fillPDFForm(options: GeneratePDFOptions): Promise<Buffer> {
    try {
      console.log(`Starting PDF form filling for template: ${options.templatePath}`);

      // Check if template file exists
      if (!fs.existsSync(options.templatePath)) {
        throw new Error(`Template file not found: ${options.templatePath}`);
      }

      // Read the PDF file
      const existingPdfBytes = fs.readFileSync(options.templatePath);

      // Load the PDF document - ignore encryption for California court forms
      const pdfDoc = await PDFDocument.load(existingPdfBytes, {
        ignoreEncryption: true
      });

      // Get the form
      const form = pdfDoc.getForm();

      console.log(`Form loaded with ${form.getFields().length} total fields`);

      // Fill form fields with data
      let fieldsFilledCount = 0;
      for (const [fieldName, fieldValue] of Object.entries(options.formData)) {
        try {
          // Try to get the field - use getFieldMaybe to avoid throwing errors
          const field = form.getFieldMaybe(fieldName);

          if (field) {
            // Check field type and set value appropriately
            if (field.constructor.name === 'PDFTextField') {
              (field as any).setText(String(fieldValue));
              fieldsFilledCount++;
              console.log(`Filled text field: ${fieldName} = ${fieldValue}`);
            } else if (field.constructor.name === 'PDFCheckBox') {
              if (fieldValue === 'Yes' || fieldValue === true) {
                (field as any).check();
              } else {
                (field as any).uncheck();
              }
              fieldsFilledCount++;
              console.log(`Set checkbox field: ${fieldName} = ${fieldValue}`);
            }
          } else {
            console.warn(`Field not found: ${fieldName}`);
          }
        } catch (fieldError) {
          console.warn(`Could not fill field ${fieldName}: ${fieldError}`);
        }
      }

      // Update field appearances to ensure proper rendering
      form.updateFieldAppearances();

      console.log(`Successfully filled ${fieldsFilledCount} out of ${Object.keys(options.formData).length} requested fields`);

      // Generate the filled PDF
      const pdfBytes = await pdfDoc.save();

      console.log('PDF form filling completed successfully');
      return Buffer.from(pdfBytes);

    } catch (error) {
      console.error('PDF form filling error:', error);
      throw new Error(`PDF form filling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map case data to proper form field names for California guardianship forms
   * Based on analysis of 954 fields across all PDF templates
   */
  private mapCaseDataToFormFields(caseData: any, formType: string): PDFFormData {
    const formData = caseData.form_data || {};

    // Each form type has different field names in the actual PDF
    switch (formType) {
      case 'GC-210':
        return {
          // Court Information - Standard header fields
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': formData.filing_county || '',
          'CaseNumber_ft[0]': caseData.id || '',

          // Common form fields - these are the generic FillText fields
          'FillText5[0]': formData.guardian_full_name || '', // Petitioner name
          'FillText6[0]': formData.minor_full_name || '', // Minor's name
          'FillText9[0]': formData.minor_date_of_birth || '', // Minor's DOB
          'FillText10[0]': formData.minor_current_address || '', // Minor's address
          'FillText11[0]': formData.guardian_relationship || '', // Relationship to minor

          // Parent information
          'FillText3[0]': formData.mother_full_name || '',
          'FillTxt6[0]': formData.father_full_name || '',

          // Guardian address
          'FillText10001[0]': formData.guardian_address || '',
        };

      case 'GC-220':
        return {
          // Court Information
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': formData.filing_county || '',
          'CaseNumber_ft[0]': caseData.id || '',

          // SIJS specific fields
          'FillText5[0]': formData.minor_full_name || '',
          'FillText6[0]': formData.sijs_abuse_neglect_abandonment ? 'Yes' : 'No',
          'FillText9[0]': formData.sijs_not_in_best_interest ? 'Yes' : 'No',
          'FillText10[0]': formData.mother_reunification || '',
          'FillText11[0]': formData.father_reunification || '',
        };

      case 'FL-105':
        return {
          // Court Information - FL-105 has different naming pattern
          'CrtCounty[0]': formData.filing_county || '',
          'CaseNumber[0]': caseData.id || '',

          // Attorney information
          'BarNo_ft[0]': formData.attorney_bar_number || '',
          'AttyName_ft[0]': formData.attorney_name || '',
          'Phone[0]': formData.attorney_phone || '',
          'Email[0]': formData.attorney_email || '',

          // Child information
          'Name[0]': formData.minor_full_name || '',
          'CrtStreet[0]': formData.minor_current_address || '',
          'CrtMailingAdd[0]': formData.minor_previous_addresses || 'None',
        };

      case 'GC-020':
        return {
          // Notice of Hearing
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': formData.filing_county || '',
          'CaseNumber_ft[0]': caseData.id || '',

          // Basic info
          'FillText5[0]': formData.minor_full_name || '',
          'FillText6[0]': formData.guardian_full_name || '',

          // Court will fill these
          'FillText9[0]': '', // Hearing date
          'FillText10[0]': '', // Hearing time
        };

      case 'GC-210P':
        return {
          // Child Information Attachment
          'topmostSubform[0].Page1[0].Stamp_court_case[0].CourtInfo_ft[0]': formData.filing_county || '',
          'topmostSubform[0].Page1[0].Stamp_court_case[0].CaseNumber_ft[0]': caseData.id || '',

          // Child specific fields
          'AllChildNames[0]': formData.minor_full_name || '',
          'FillText72[0]': formData.minor_date_of_birth || '',
          'FillText71[0]': formData.minor_current_address || '',
          'FillText70[0]': formData.guardian_relationship || '',
        };

      default:
        return formData;
    }
  }

  /**
   * Generate multiple PDFs for California guardianship forms
   */
  async generateGuardianshipForms(caseData: any): Promise<{ [formType: string]: Buffer }> {
    const forms: { [formType: string]: Buffer } = {};

    // Define the forms we want to generate
    const formTypes = ['GC-210', 'GC-220', 'FL-105', 'GC-020'];

    try {
      // Generate each form with proper field mapping
      for (const formType of formTypes) {
        const templatePath = `${process.cwd()}/public/templates/${formType}.pdf`;

        try {
          // Check if template file exists
          const fs = require('fs');
          if (!fs.existsSync(templatePath)) {
            console.warn(`Template ${formType}.pdf not found. Creating placeholder PDF.`);

            // Generate a placeholder PDF with form data for testing
            const formFieldData = this.mapCaseDataToFormFields(caseData, formType);
            forms[formType] = await this.generatePlaceholderPDF(formType, formFieldData);

            console.log(`Generated placeholder ${formType} successfully with ${Object.keys(formFieldData).length} fields`);
            continue;
          }

          // Map case data to specific form fields for this form type
          const formFieldData = this.mapCaseDataToFormFields(caseData, formType);

          forms[formType] = await this.fillPDFForm({
            templatePath,
            formData: formFieldData,
            outputFileName: `${formType}_${caseData.id}.pdf`
          });

          console.log(`Generated ${formType} successfully with ${Object.keys(formFieldData).length} fields`);
        } catch (error) {
          console.error(`Failed to generate ${formType}:`, error);

          // Generate placeholder PDF as fallback
          try {
            const formFieldData = this.mapCaseDataToFormFields(caseData, formType);
            forms[formType] = await this.generatePlaceholderPDF(formType, formFieldData);
            console.log(`Generated fallback placeholder for ${formType}`);
          } catch (fallbackError) {
            console.error(`Failed to generate fallback for ${formType}:`, fallbackError);
          }
        }
      }

      return forms;

    } catch (error) {
      console.error('Error generating guardianship forms:', error);
      throw error;
    }
  }

  /**
   * Generate a placeholder PDF when templates are missing
   */
  private async generatePlaceholderPDF(formType: string, formData: PDFFormData): Promise<Buffer> {
    const content = this.createPlaceholderContent(formType, formData);
    return Buffer.from(content, 'base64');
  }

  /**
   * Create placeholder PDF content with actual form data
   */
  private createPlaceholderContent(formType: string, formData: PDFFormData): string {
    const fields = Object.entries(formData)
      .filter(([key, value]) => value && value.toString().trim() !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
/F2 5 0 R
>>
>>
/Contents 6 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

6 0 obj
<<
/Length 400
>>
stream
BT
/F1 16 Tf
50 740 Td
(CALIFORNIA GUARDIANSHIP FORM ${formType}) Tj
0 -30 Td
/F1 12 Tf
(PLACEHOLDER - Template Missing) Tj
0 -40 Td
/F2 10 Tf
${fields.split('\n').map(line => `0 -15 Td\n(${line.replace(/[()]/g, '')}) Tj`).join('\n')}
0 -30 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -15 Td
(Add real PDF templates to public/templates/ folder) Tj
ET
endstream
endobj

xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000268 00000 n
0000000339 00000 n
0000000405 00000 n
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
800
%%EOF`;

    return Buffer.from(pdfContent).toString('base64');
  }


}

// Export singleton instance
export const californiaPDFService = new CaliforniaPDFFormService();

// Form type definitions for California guardianship
export const CALIFORNIA_FORMS = {
  'GC-210': 'Petition for Appointment of Guardian',
  'GC-220': 'SIJS Petition',
  'GC-210CA': 'Child Information Attachment',
  'FL-105': 'UCCJEA Declaration',
  'GC-020': 'Notice of Hearing'
} as const;

export type CaliforniaFormType = keyof typeof CALIFORNIA_FORMS;