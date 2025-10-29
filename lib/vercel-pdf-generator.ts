/**
 * Vercel-Compatible PDF Generator using pdf-lib
 *
 * STRATEGY: Load official California court PDFs and overlay data at correct positions
 * - Official PDFs use XFA forms which cannot be programmatically filled
 * - Solution: Use official PDF as background, overlay text at correct coordinates
 * - Result: User gets PDFs that LOOK like official court forms with their data filled in
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export interface CourtFormData {
  [key: string]: any;
}

export class VercelPDFGenerator {
  private templatesPath: string;

  constructor() {
    // Support both local development and Vercel deployment
    this.templatesPath = path.join(process.cwd(), 'public', 'templates');
  }

  /**
   * Load a PDF template file, with fallback to creating new PDF if template is missing or corrupted
   */
  private async loadTemplate(filename: string): Promise<PDFDocument> {
    const templatePath = path.join(this.templatesPath, filename);
    
    try {
      // Check if file exists
      if (!fs.existsSync(templatePath)) {
        console.warn(`Template file not found: ${templatePath}, creating new PDF`);
        return await PDFDocument.create();
      }

      // Try to load the PDF
      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes, {
        ignoreEncryption: true,
        updateMetadata: false
      });

      // Verify PDF has pages
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        console.warn(`Template ${filename} has no pages, creating new PDF`);
        return await PDFDocument.create();
      }

      return pdfDoc;
    } catch (error) {
      // If PDF is corrupted/XFA or can't be loaded, create new PDF from scratch
      console.warn(`Failed to load template ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}, creating new PDF`);
      return await PDFDocument.create();
    }
  }

  /**
   * California court PDFs are corrupt/XFA and cannot be loaded with pdf-lib
   * Solution: Create professional-looking PDFs from scratch that MIMIC official forms
   */
  private drawFormHeader(page: any, font: any, fontBold: any, formNumber: string, formTitle: string, county: string, caseNumber: string) {
    const { width, height } = page.getSize();
    const fontSize = 9;

    // Top border line
    page.drawRectangle({
      x: 30,
      y: height - 30,
      width: width - 60,
      height: 1,
      color: rgb(0, 0, 0)
    });

    // Left column - Attorney Info Header
    page.drawText('ATTORNEY OR PARTY WITHOUT ATTORNEY:', {
      x: 40,
      y: height - 50,
      size: 7,
      font: fontBold
    });

    // Right column - Court Info Box
    const rightBoxX = width - 240;
    page.drawRectangle({
      x: rightBoxX,
      y: height - 140,
      width: 210,
      height: 110,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5
    });

    page.drawText('SUPERIOR COURT OF CALIFORNIA', {
      x: rightBoxX + 20,
      y: height - 60,
      size: 9,
      font: fontBold
    });

    page.drawText(`COUNTY OF ${county.toUpperCase()}`, {
      x: rightBoxX + 45,
      y: height - 75,
      size: 9,
      font: fontBold
    });

    // Case number box
    page.drawText('CASE NUMBER:', {
      x: rightBoxX + 10,
      y: height - 115,
      size: 7,
      font: fontBold
    });

    page.drawText(caseNumber, {
      x: rightBoxX + 20,
      y: height - 130,
      size: 10,
      font
    });

    // Form title (centered)
    const titleY = height - 170;
    page.drawText(formTitle, {
      x: (width - formTitle.length * 6) / 2,
      y: titleY,
      size: 14,
      font: fontBold
    });

    // Form number (right side)
    page.drawText(formNumber, {
      x: width - 100,
      y: titleY,
      size: 10,
      font: fontBold
    });

    return height - 200; // Return Y position for content start
  }

  /**
   * Generate GC-210 (Petition for Appointment of Guardian)
   * Creates professional form from scratch (official PDFs are corrupt)
   */
  async generateGC210(formData: CourtFormData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 9;

    const county = formData.filing_county || 'LOS ANGELES';
    const caseNumber = formData.case_number || '';

    // Draw standard California court form header
    let y = this.drawFormHeader(page, font, fontBold, 'GC-210',
      'PETITION FOR APPOINTMENT OF GUARDIAN OF THE PERSON',
      county, caseNumber);

    // Attorney information (left column)
    y -= 10;
    if (formData.attorney_name) {
      page.drawText(formData.attorney_name, { x: 40, y, size: fontSize, font: fontBold });
      y -= 12;
    }
    if (formData.attorney_bar_number) {
      page.drawText(`State Bar No. ${formData.attorney_bar_number}`, { x: 40, y, size: fontSize - 1, font });
      y -= 12;
    }
    if (formData.attorney_phone) {
      page.drawText(formData.attorney_phone, { x: 40, y, size: fontSize - 1, font });
      y -= 12;
    }
    if (formData.attorney_email) {
      page.drawText(formData.attorney_email, { x: 40, y, size: fontSize - 1, font });
      y -= 12;
    }

    // Main form content
    y -= 30;

    // Item 1 - Minor Information
    page.drawText('1. MINOR INFORMATION:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    const minorName = formData.minor_name || formData.minor_full_name || '';
    page.drawText('a. Name of minor:', { x: 50, y, size: fontSize, font: fontBold });
    page.drawText(minorName, { x: 150, y, size: fontSize, font });
    y -= 15;

    const minorDOB = formData.minor_date_of_birth || formData.minor_dob || '';
    page.drawText('b. Date of birth:', { x: 50, y, size: fontSize, font: fontBold });
    page.drawText(minorDOB, { x: 150, y, size: fontSize, font });

    if (formData.minor_gender) {
      page.drawText('Gender:', { x: 280, y, size: fontSize, font: fontBold });
      page.drawText(formData.minor_gender, { x: 330, y, size: fontSize, font });
    }
    y -= 15;

    const minorAddress = formData.minor_address || formData.minor_current_address || '';
    if (minorAddress) {
      page.drawText('c. Address:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(minorAddress, { x: 150, y, size: fontSize, font });
      y -= 15;
    }

    // Item 2 - Proposed Guardian
    y -= 10;
    page.drawText('2. PROPOSED GUARDIAN:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    if (formData.guardian_name) {
      page.drawText('a. Name:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(formData.guardian_name, { x: 150, y, size: fontSize, font });
      y -= 15;
    }

    if (formData.guardian_relationship) {
      page.drawText('b. Relationship to minor:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(formData.guardian_relationship, { x: 180, y, size: fontSize, font });
      y -= 15;
    }

    if (formData.guardian_address) {
      page.drawText('c. Address:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(formData.guardian_address, { x: 150, y, size: fontSize, font });
      y -= 15;
    }

    // Item 3 - Parents
    y -= 10;
    page.drawText('3. PARENTS:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    const motherName = formData.mother_name || formData.mother_full_name || '';
    if (motherName) {
      page.drawText('a. Mother:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(motherName, { x: 150, y, size: fontSize, font });
      y -= 15;
    }

    const fatherName = formData.father_name || formData.father_full_name || '';
    if (fatherName) {
      page.drawText('b. Father:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(fatherName, { x: 150, y, size: fontSize, font });
      y -= 15;
    }

    // Footer
    page.drawLine({
      start: { x: 40, y: 60 },
      end: { x: 572, y: 60 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText(`GC-210 [Rev. ${new Date().getFullYear()}]`, {
      x: 40,
      y: 45,
      size: 7,
      font
    });

    page.drawText('PETITION FOR APPOINTMENT OF GUARDIAN OF THE PERSON', {
      x: 200,
      y: 45,
      size: 7,
      font
    });

    page.drawText('Page 1 of 1', {
      x: 520,
      y: 45,
      size: 7,
      font
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate GC-220 (SIJS Findings)
   * Creates professional SIJS petition from scratch
   */
  async generateGC220(formData: CourtFormData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 9;

    const county = formData.filing_county || 'LOS ANGELES';
    const caseNumber = formData.case_number || '';

    let y = this.drawFormHeader(page, font, fontBold, 'GC-220',
      'FINDINGS AND ORDERS - SPECIAL IMMIGRANT JUVENILE STATUS',
      county, caseNumber);

    y -= 20;
    const minorName = formData.minor_name || formData.minor_full_name || '';
    page.drawText('IN THE MATTER OF:', { x: 40, y, size: fontSize + 1, font: fontBold });
    page.drawText(minorName, { x: 180, y, size: fontSize + 1, font: fontBold });

    y -= 30;
    page.drawText('FINDINGS:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    page.drawText('1. It is in the best interest of the minor that:', { x: 50, y, size: fontSize, font: fontBold });
    y -= 15;
    if (formData.best_interest_explanation) {
      const text = formData.best_interest_explanation.substring(0, 250);
      page.drawText(text, { x: 60, y, size: fontSize - 1, font });
      y -= 20;
    }

    page.drawText('2. Reunification with parents is not viable due to:', { x: 50, y, size: fontSize, font: fontBold });
    y -= 15;
    if (formData.return_harmful_explanation) {
      const text = formData.return_harmful_explanation.substring(0, 250);
      page.drawText(text, { x: 60, y, size: fontSize - 1, font });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate FL-105 (UCCJEA Declaration)
   * Creates professional form from scratch (templates may be corrupted/XFA)
   */
  async generateFL105(formData: CourtFormData): Promise<Buffer> {
    // Create PDF from scratch (templates are often XFA/corrupted)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 9;

    const county = formData.filing_county || 'LOS ANGELES';
    const caseNumber = formData.case_number || '';

    // Draw standard California court form header
    let y = this.drawFormHeader(page, font, fontBold, 'FL-105',
      'DECLARATION UNDER UNIFORM CHILD CUSTODY JURISDICTION AND ENFORCEMENT ACT (UCCJEA)',
      county, caseNumber);

    y -= 20;
    page.drawText('CHILD INFORMATION:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    const minorName = formData.minor_name || formData.minor_full_name || '';
    if (minorName) {
      page.drawText('Name:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(minorName, { x: 100, y, size: fontSize, font });
      y -= 15;
    }

    const minorDOB = formData.minor_date_of_birth || formData.minor_dob || '';
    if (minorDOB) {
      page.drawText('Date of Birth:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(minorDOB, { x: 130, y, size: fontSize, font });
      y -= 15;
    }

    if (formData.country_of_birth) {
      page.drawText('Country of Birth:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(formData.country_of_birth, { x: 150, y, size: fontSize, font });
      y -= 15;
    }

    y -= 10;
    page.drawText('RESIDENCE INFORMATION:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    if (formData.minor_address || formData.minor_current_address) {
      const address = formData.minor_address || formData.minor_current_address;
      page.drawText('Current Address:', { x: 50, y, size: fontSize, font: fontBold });
      // Handle multi-line addresses
      const addressLines = address.split(',').map((line: string) => line.trim());
      addressLines.forEach((line: string) => {
        page.drawText(line, { x: 50, y, size: fontSize, font });
        y -= 15;
      });
    }

    // Footer
    page.drawLine({
      start: { x: 40, y: 60 },
      end: { x: 572, y: 60 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText(`FL-105 [Rev. ${new Date().getFullYear()}]`, {
      x: 40,
      y: 45,
      size: 7,
      font
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate GC-020 (Notice of Hearing)
   * Creates professional form from scratch (templates may be corrupted/XFA)
   */
  async generateGC020(formData: CourtFormData): Promise<Buffer> {
    // Create PDF from scratch (templates are often XFA/corrupted)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 9;

    const county = formData.filing_county || 'LOS ANGELES';
    const caseNumber = formData.case_number || '';

    // Draw standard California court form header
    let y = this.drawFormHeader(page, font, fontBold, 'GC-020',
      'NOTICE OF HEARING—GUARDIANSHIP',
      county, caseNumber);

    y -= 30;
    page.drawText('NOTICE IS GIVEN THAT:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 25;

    const minorName = formData.minor_name || formData.minor_full_name || '';
    if (minorName) {
      page.drawText('Minor:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(minorName, { x: 100, y, size: fontSize, font });
      y -= 20;
    }

    if (formData.guardian_name) {
      page.drawText('Petitioner/Guardian:', { x: 50, y, size: fontSize, font: fontBold });
      page.drawText(formData.guardian_name, { x: 170, y, size: fontSize, font });
      y -= 20;
    }

    y -= 20;
    page.drawText('HEARING DETAILS:', { x: 40, y, size: fontSize + 1, font: fontBold });
    y -= 20;

    page.drawText('Date: _______________', { x: 50, y, size: fontSize, font });
    y -= 15;
    page.drawText('Time: _______________', { x: 50, y, size: fontSize, font });
    y -= 15;
    page.drawText('Department: _________', { x: 50, y, size: fontSize, font });
    y -= 15;
    page.drawText('Room: _______________', { x: 50, y, size: fontSize, font });

    y -= 30;
    page.drawText('Note: Hearing date and time will be set by the court clerk.', {
      x: 50,
      y,
      size: fontSize - 1,
      font: fontBold
    });

    // Footer
    page.drawLine({
      start: { x: 40, y: 60 },
      end: { x: 572, y: 60 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText(`GC-020 [Rev. ${new Date().getFullYear()}]`, {
      x: 40,
      y: 45,
      size: 7,
      font
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

// Export singleton instance
export const vercelPDFGenerator = new VercelPDFGenerator();
