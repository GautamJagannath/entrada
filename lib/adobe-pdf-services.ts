import { PDFDocument, PDFForm, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import { htmlPDFGenerator } from './html-pdf-generator';

export interface PDFFormData {
  [fieldName: string]: string | number | boolean;
}

export interface GeneratePDFOptions {
  templatePath: string;
  formData: PDFFormData;
  outputFileName?: string;
}

class CaliforniaPDFFormService {
  private useHTMLGeneration: boolean = true; // Use HTML-to-PDF instead of form filling

  constructor() {
    console.log('California PDF Form Service initialized');
    console.log('PDF Generation method: HTML-to-PDF (Puppeteer)');
  }

  /**
   * Fill a PDF form using AcroForm fields (proper method) with fallback to text overlay
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
        ignoreEncryption: true,
        updateMetadata: false
      });

      console.log(`PDF loaded with ${pdfDoc.getPageCount()} pages`);

      // Try to get the form
      let form: PDFForm | null = null;
      let formFieldsCount = 0;

      try {
        form = pdfDoc.getForm();
        const fields = form.getFields();
        formFieldsCount = fields.length;
        console.log(`✓ PDF has ${formFieldsCount} form fields`);
      } catch (error) {
        console.warn('⚠ Could not access PDF form fields:', error);
      }

      let fieldsFilledCount = 0;
      let fieldsFilledByOverlay = 0;

      // Method 1: Try to fill actual form fields (proper approach)
      if (form && formFieldsCount > 0) {
        console.log('Attempting to fill AcroForm fields...');

        for (const [fieldName, fieldValue] of Object.entries(options.formData)) {
          if (!fieldValue || fieldValue.toString().trim() === '') continue;

          try {
            // Try to get the field
            const field = form.getField(fieldName);
            const fieldType = field.constructor.name;

            // Fill based on field type
            if (fieldType === 'PDFTextField') {
              const textField = form.getTextField(fieldName);
              textField.setText(fieldValue.toString());
              textField.enableReadOnly(); // Lock field after filling
              fieldsFilledCount++;
              console.log(`✓ Filled text field: ${fieldName}`);
            } else if (fieldType === 'PDFCheckBox') {
              const checkbox = form.getCheckBox(fieldName);
              if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'yes' || fieldValue === '1') {
                checkbox.check();
              } else {
                checkbox.uncheck();
              }
              checkbox.enableReadOnly();
              fieldsFilledCount++;
              console.log(`✓ Filled checkbox: ${fieldName}`);
            } else if (fieldType === 'PDFRadioGroup') {
              const radioGroup = form.getRadioGroup(fieldName);
              radioGroup.select(fieldValue.toString());
              radioGroup.enableReadOnly();
              fieldsFilledCount++;
              console.log(`✓ Filled radio: ${fieldName}`);
            } else if (fieldType === 'PDFDropdown') {
              const dropdown = form.getDropdown(fieldName);
              dropdown.select(fieldValue.toString());
              dropdown.enableReadOnly();
              fieldsFilledCount++;
              console.log(`✓ Filled dropdown: ${fieldName}`);
            }
          } catch (error) {
            // Field not found or can't be filled - this is expected for unmapped fields
            // console.debug(`Field ${fieldName} not found or can't be filled`);
          }
        }

        console.log(`✓ Successfully filled ${fieldsFilledCount} AcroForm fields`);
      }

      // Method 2: Fallback to text overlay for unmapped fields or if no form fields exist
      if (formFieldsCount === 0 || fieldsFilledCount === 0) {
        console.log('Falling back to text overlay method...');

        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fieldPositions = this.getFieldPositions(options.templatePath);

        for (const [fieldName, fieldValue] of Object.entries(options.formData)) {
          if (!fieldValue || fieldValue.toString().trim() === '') continue;

          const position = fieldPositions[fieldName];
          if (position) {
            const page = pdfDoc.getPages()[position.page - 1];

            if (page) {
              page.drawText(fieldValue.toString(), {
                x: position.x,
                y: position.y,
                size: position.size || 10,
                font: position.bold ? boldFont : helveticaFont,
                color: rgb(0, 0, 0)
              });

              fieldsFilledByOverlay++;
            }
          }
        }

        console.log(`✓ Added ${fieldsFilledByOverlay} text overlays`);
      }

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false // Better compatibility
      });

      console.log(`✅ PDF filling completed: ${fieldsFilledCount} fields + ${fieldsFilledByOverlay} overlays`);
      return Buffer.from(pdfBytes);

    } catch (error) {
      console.error('❌ PDF filling error:', error);
      console.log(`Falling back to placeholder PDF for ${options.templatePath}`);

      // Fall back to placeholder PDF generation
      const formType = options.templatePath.split('/').pop()?.replace('.pdf', '') || 'Unknown';
      return this.generatePlaceholderPDF(formType, options.formData);
    }
  }

  /**
   * Get field positions for text overlays on California court forms
   * Coordinates are based on PDF coordinate system (0,0 at bottom-left)
   */
  private getFieldPositions(templatePath: string): Record<string, { x: number, y: number, page: number, size?: number, bold?: boolean }> {
    const fileName = templatePath.split('/').pop();

    switch (fileName) {
      case 'GC-210.pdf':
        return {
          // Page 1 - Petition for Appointment of Guardian
          'minor_name': { x: 150, y: 650, page: 1, size: 10 },
          'minor_dob': { x: 150, y: 620, page: 1, size: 10 },
          'guardian_name': { x: 150, y: 590, page: 1, size: 10 },
          'guardian_relationship': { x: 400, y: 590, page: 1, size: 10 },
          'guardian_address': { x: 150, y: 560, page: 1, size: 10 },
          'mother_name': { x: 150, y: 530, page: 1, size: 10 },
          'father_name': { x: 150, y: 500, page: 1, size: 10 },
          'filing_county': { x: 150, y: 720, page: 1, size: 10, bold: true },
        };

      case 'GC-220.pdf':
        return {
          // SIJS Petition
          'minor_name': { x: 150, y: 650, page: 1, size: 10 },
          'sijs_best_interest': { x: 150, y: 600, page: 1, size: 10 },
          'return_harmful': { x: 150, y: 570, page: 1, size: 10 },
          'best_interest_explanation': { x: 150, y: 540, page: 1, size: 9 },
          'return_harmful_explanation': { x: 150, y: 510, page: 1, size: 9 },
          'filing_county': { x: 150, y: 720, page: 1, size: 10, bold: true },
        };

      case 'FL-105.pdf':
        return {
          // UCCJEA Declaration
          'minor_name': { x: 150, y: 650, page: 1, size: 10 },
          'country_of_birth': { x: 150, y: 620, page: 1, size: 10 },
          'guardian_name': { x: 150, y: 590, page: 1, size: 10 },
          'guardian_address': { x: 150, y: 560, page: 1, size: 10 },
          'filing_county': { x: 150, y: 720, page: 1, size: 10, bold: true },
        };

      case 'GC-020.pdf':
        return {
          // Notice of Hearing
          'minor_name': { x: 150, y: 650, page: 1, size: 10 },
          'guardian_name': { x: 150, y: 620, page: 1, size: 10 },
          'filing_county': { x: 150, y: 720, page: 1, size: 10, bold: true },
          // Court will fill hearing date/time
        };

      case 'GC-210P.pdf':
        return {
          // Child Information Attachment
          'minor_name': { x: 150, y: 650, page: 1, size: 10 },
          'minor_dob': { x: 400, y: 650, page: 1, size: 10 },
          'guardian_relationship': { x: 150, y: 620, page: 1, size: 10 },
          'guardian_known_duration': { x: 400, y: 620, page: 1, size: 10 },
        };

      default:
        return {};
    }
  }

  /**
   * Map case data to proper form field names for California guardianship forms
   * Based on analysis of 954 fields across all PDF templates
   *
   * Field names from public/templates/pdf_field_analysis_summary.md
   */
  private mapCaseDataToFormFields(caseData: any, formType: string): PDFFormData {
    const formData = caseData.form_data || {};

    // Each form type has different field names in the actual PDF
    switch (formType) {
      case 'GC-210':
        return {
          // === COURT INFORMATION (Standard Header) ===
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': formData.filing_county || '',
          'CrtCounty_ft[0]': formData.filing_county || '',
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].Street_ft[0]': formData.court_address || '',
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CityZip_ft[0]': formData.court_city_zip || '',
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].Branch_ft[0]': formData.court_branch || '',
          'Branch_ft[0]': formData.court_branch || '',

          // === CASE NUMBER (appears on multiple pages) ===
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CaseNumber[0].CaseNumber_ft[0]': caseData.id || '',
          'topmostSubform[0].Page2[0].CaptionPx_sf[0].CaseNumber[0].CaseNumber_ft[0]': caseData.id || '',
          'topmostSubform[0].Page3[0].CaptionPx_sf[0].CaseNumber[0].CaseNumber_ft[0]': caseData.id || '',
          'CaseNumber_ft[0]': caseData.id || '',

          // === ATTORNEY INFORMATION ===
          'AttyName_ft[0]': formData.attorney_name || '',
          'AttyBarNo_dc[0]': formData.attorney_bar_number || '',
          'AttyFirm_ft[0]': formData.attorney_firm || '',
          'AttyStreet_ft[0]': formData.attorney_address || '',
          'AttyCity_ft[0]': formData.attorney_city || '',
          'AttyState_ft[0]': formData.attorney_state || '',
          'AttyZip_ft[0]': formData.attorney_zip || '',
          'Email_ft[0]': formData.attorney_email || '',
          'Fax_ft[0]': formData.attorney_fax || '',
          'AttyFor_ft[0]': formData.guardian_name || '', // Attorney for (petitioner)

          // === PETITIONER/GUARDIAN INFORMATION ===
          'FillText5[0]': formData.guardian_name || '', // Petitioner name
          'FillText10001[0]': formData.guardian_address || '',
          'FillText11[0]': formData.guardian_relationship || '',

          // === MINOR INFORMATION ===
          'FillText6[0]': formData.minor_name || formData.minor_full_name || '',
          'FillText9[0]': formData.minor_dob || formData.minor_date_of_birth || '',
          'FillText10[0]': formData.minor_address || formData.minor_current_address || '',

          // === PARENT INFORMATION ===
          'FillText3[0]': formData.mother_name || formData.mother_full_name || '',
          'FillTxt6[0]': formData.father_name || formData.father_full_name || '',

          // === CHECKBOXES (Guardian type, relationships, etc) ===
          'topmostSubform[0].Page1[0].CheckBox1[0]': formData.guardian_type === 'person' ? '1' : '0',
          'topmostSubform[0].Page1[0].CheckBox2[0]': formData.guardian_type === 'nonprofit' ? '1' : '0',
          'topmostSubform[0].Page1[0].CheckBox3[0]': formData.is_relative ? '1' : '0',
        };

      case 'GC-220':
        return {
          // === COURT INFORMATION ===
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': formData.filing_county || '',
          'CrtCounty_ft[0]': formData.filing_county || '',

          // === CASE NUMBER ===
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CaseNumber[0].CaseNumber_ft[0]': caseData.id || '',
          'CaseNumber_ft[0]': caseData.id || '',

          // === ATTORNEY INFORMATION (same as GC-210) ===
          'AttyName_ft[0]': formData.attorney_name || '',
          'AttyBarNo_dc[0]': formData.attorney_bar_number || '',
          'Email_ft[0]': formData.attorney_email || '',

          // === MINOR INFORMATION ===
          'FillText5[0]': formData.minor_name || formData.minor_full_name || '',
          'FillText9[0]': formData.minor_dob || formData.minor_date_of_birth || '',

          // === SIJS SPECIFIC FIELDS ===
          'FillText6[0]': formData.sijs_best_interest ? 'Yes' : 'No',
          'FillText7[0]': formData.sijs_return_harmful ? 'Yes' : 'No',
          'FillText10[0]': formData.best_interest_explanation || '',
          'FillText11[0]': formData.return_harmful_explanation || '',

          // Parent reunification status
          'FillText12[0]': formData.mother_reunification || '',
          'FillText13[0]': formData.father_reunification || '',

          // === CHECKBOXES (SIJS findings) ===
          'topmostSubform[0].Page1[0].CheckBox1[0]': formData.sijs_abuse ? '1' : '0',
          'topmostSubform[0].Page1[0].CheckBox2[0]': formData.sijs_neglect ? '1' : '0',
          'topmostSubform[0].Page1[0].CheckBox3[0]': formData.sijs_abandonment ? '1' : '0',
        };

      case 'FL-105':
        return {
          // FL-105 has different field naming (shorter paths)

          // === COURT INFORMATION ===
          'CrtCounty[0]': formData.filing_county || '',
          'CrtStreet[0]': formData.court_address || '',
          'CrtCityZip[0]': formData.court_city_zip || '',

          // === CASE NUMBER ===
          'CaseNumber[0]': caseData.id || '',

          // === ATTORNEY INFORMATION ===
          'BarNo_ft[0]': formData.attorney_bar_number || '',
          'AttyName_ft[0]': formData.attorney_name || '',
          'Phone[0]': formData.attorney_phone || '',
          'Email[0]': formData.attorney_email || '',
          'Fax[0]': formData.attorney_fax || '',

          // === CHILD INFORMATION ===
          'Name[0]': formData.minor_name || formData.minor_full_name || '',
          'DOB[0]': formData.minor_dob || formData.minor_date_of_birth || '',
          'CrtMailingAdd[0]': formData.minor_address || formData.minor_current_address || '',

          // === UCCJEA DECLARATIONS ===
          'FillText5[0]': formData.minor_lived_in_california_since || '',
          'FillText6[0]': formData.previous_custody_cases || 'None',
        };

      case 'GC-020':
        return {
          // === COURT INFORMATION ===
          'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': formData.filing_county || '',
          'CrtCounty_ft[0]': formData.filing_county || '',

          // === CASE NUMBER ===
          'CaseNumber_ft[0]': caseData.id || '',

          // === PARTIES ===
          'FillText5[0]': formData.minor_name || formData.minor_full_name || '',
          'FillText6[0]': formData.guardian_name || '',

          // === HEARING INFORMATION (typically left blank for court to fill) ===
          'FillText9[0]': '', // Hearing date
          'FillText10[0]': '', // Hearing time
          'Dept_ft[0]': '', // Department
        };

      case 'GC-210P':
        return {
          // === COURT INFORMATION ===
          'topmostSubform[0].Page1[0].Stamp_court_case[0].CourtInfo_ft[0]': formData.filing_county || '',
          'topmostSubform[0].Page1[0].Stamp_court_case[0].CaseNumber_ft[0]': caseData.id || '',

          // === CHILD INFORMATION ===
          'AllChildNames[0]': formData.minor_name || formData.minor_full_name || '',
          'FillText72[0]': formData.minor_dob || formData.minor_date_of_birth || '',
          'FillText71[0]': formData.minor_address || formData.minor_current_address || '',
          'FillText70[0]': formData.guardian_relationship || '',

          // === GUARDIAN RELATIONSHIP DETAILS ===
          'FillText69[0]': formData.guardian_known_duration || '',
          'FillText68[0]': formData.guardian_relationship_quality || '',
        };

      default:
        return formData;
    }
  }

  /**
   * Generate multiple PDFs for California guardianship forms
   * Uses HTML-to-PDF generation for maximum compatibility
   */
  async generateGuardianshipForms(caseData: any): Promise<{ [formType: string]: Buffer }> {
    const forms: { [formType: string]: Buffer } = {};
    const formData = caseData.form_data || {};

    // Prepare data for HTML generation
    const htmlData = {
      ...formData,
      case_number: caseData.id,
      filing_county: formData.filing_county || '',
      // Ensure consistent field naming
      minor_name: formData.minor_name || formData.minor_full_name || '',
      guardian_name: formData.guardian_name || '',
      mother_name: formData.mother_name || formData.mother_full_name || '',
      father_name: formData.father_name || formData.father_full_name || '',
    };

    try {
      console.log(`🎨 Generating PDFs using HTML-to-PDF method...`);

      // Generate GC-210
      try {
        console.log('Generating GC-210 (Petition for Appointment of Guardian)...');
        forms['GC-210'] = await htmlPDFGenerator.generateGC210(htmlData);
        console.log('✓ GC-210 generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate GC-210:', error);
      }

      // Generate GC-220
      try {
        console.log('Generating GC-220 (SIJS Petition)...');
        forms['GC-220'] = await htmlPDFGenerator.generateGC220(htmlData);
        console.log('✓ GC-220 generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate GC-220:', error);
      }

      // Generate FL-105
      try {
        console.log('Generating FL-105 (UCCJEA Declaration)...');
        forms['FL-105'] = await htmlPDFGenerator.generateFL105(htmlData);
        console.log('✓ FL-105 generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate FL-105:', error);
      }

      // Generate GC-020
      try {
        console.log('Generating GC-020 (Notice of Hearing)...');
        forms['GC-020'] = await htmlPDFGenerator.generateGC020(htmlData);
        console.log('✓ GC-020 generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate GC-020:', error);
      }

      console.log(`✅ Generated ${Object.keys(forms).length} PDFs successfully`);
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