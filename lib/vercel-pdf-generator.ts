/**
 * Vercel-Compatible PDF Generator using pdf-lib
 *
 * Uses only pdf-lib (no PDFKit, no Puppeteer, no native dependencies)
 * Guaranteed to work in Vercel's serverless environment
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface CourtFormData {
  [key: string]: any;
}

export class VercelPDFGenerator {
  /**
   * Generate GC-210 (Petition for Appointment of Guardian)
   */
  async generateGC210(formData: CourtFormData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let y = height - 50;

    // Header
    page.drawText('ATTORNEY OR PARTY WITHOUT ATTORNEY:', { x: 50, y, size: 10, font });
    y -= 15;
    page.drawText(formData.attorney_name || '_____________________', { x: 50, y, size: 9, font });

    // Court info
    page.drawText('SUPERIOR COURT OF CALIFORNIA', { x: 350, y: height - 50, size: 10, font });
    page.drawText(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, {
      x: 350, y: height - 65, size: 10, font
    });

    // Title
    page.drawText('PETITION FOR APPOINTMENT OF GUARDIAN', {
      x: 100, y: height - 120, size: 14, font: fontBold
    });
    page.drawText('OF THE PERSON', { x: 220, y: height - 140, size: 12, font: fontBold });
    page.drawText('GC-210', { x: 520, y: height - 120, size: 10, font });

    // Case number
    page.drawText('CASE NUMBER:', { x: 400, y: height - 180, size: 10, font });
    page.drawText(formData.case_number || '__________________', {
      x: 480, y: height - 180, size: 10, font
    });

    // Minor information
    y = height - 220;
    page.drawText('1. Minor Information:', { x: 50, y, size: 11, font: fontBold });
    y -= 20;
    page.drawText(`Name: ${formData.minor_name || formData.minor_full_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 15;
    page.drawText(`Date of Birth: ${formData.minor_date_of_birth || formData.minor_dob || '__________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 15;
    page.drawText(`Gender: ${formData.minor_gender || '__________'}`, { x: 70, y, size: 10, font });
    y -= 15;
    page.drawText(`Address: ${formData.minor_address || '_____________________'}`, {
      x: 70, y, size: 10, font
    });

    // Guardian information
    y -= 30;
    page.drawText('2. Proposed Guardian:', { x: 50, y, size: 11, font: fontBold });
    y -= 20;
    page.drawText(`Name: ${formData.guardian_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 15;
    page.drawText(`Relationship: ${formData.guardian_relationship || '__________'}`, {
      x: 70, y, size: 10, font
    });

    // Parents
    y -= 30;
    page.drawText('3. Parents:', { x: 50, y, size: 11, font: fontBold });
    y -= 20;
    page.drawText(`Mother: ${formData.mother_name || formData.mother_full_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 15;
    page.drawText(`Father: ${formData.father_name || formData.father_full_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });

    // Signature
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 100, size: 9, font });
    page.drawText('Signature: _____________________', { x: 300, y: 100, size: 9, font });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate GC-220 (SIJS Findings)
   */
  async generateGC220(formData: CourtFormData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let y = height - 50;

    // Court info
    page.drawText('SUPERIOR COURT OF CALIFORNIA', { x: 350, y, size: 10, font });
    page.drawText(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, {
      x: 350, y: y - 15, size: 10, font
    });

    // Title
    page.drawText('FINDINGS AND ORDERS AFTER HEARING', {
      x: 120, y: height - 120, size: 14, font: fontBold
    });
    page.drawText('SPECIAL IMMIGRANT JUVENILE STATUS', {
      x: 120, y: height - 140, size: 12, font: fontBold
    });
    page.drawText('GC-220', { x: 520, y: height - 120, size: 10, font });

    // Case number
    page.drawText('CASE NUMBER:', { x: 400, y: height - 180, size: 10, font });
    page.drawText(formData.case_number || '__________________', {
      x: 480, y: height - 180, size: 10, font
    });

    // Minor
    y = height - 220;
    page.drawText('Minor:', { x: 50, y, size: 11, font: fontBold });
    page.drawText(formData.minor_name || formData.minor_full_name || '_____________________', {
      x: 120, y, size: 10, font
    });

    // Findings
    y -= 40;
    page.drawText('FINDINGS:', { x: 50, y, size: 11, font: fontBold });
    y -= 25;
    page.drawText('[ ] It is in the best interest of the minor', { x: 60, y, size: 10, font });
    y -= 20;
    page.drawText('[ ] Reunification with parents is not viable', { x: 60, y, size: 10, font });
    y -= 20;
    page.drawText('[ ] Not in minor\'s best interest to return to country of origin', {
      x: 60, y, size: 10, font
    });

    // Judge signature
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 100, size: 9, font });
    page.drawText('JUDGE OF THE SUPERIOR COURT', { x: 300, y: 100, size: 9, font });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate FL-105 (UCCJEA Declaration)
   */
  async generateFL105(formData: CourtFormData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let y = height - 50;

    // Court info
    page.drawText('SUPERIOR COURT OF CALIFORNIA', { x: 350, y, size: 10, font });
    page.drawText(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, {
      x: 350, y: y - 15, size: 10, font
    });

    // Title
    page.drawText('DECLARATION UNDER UNIFORM CHILD CUSTODY', {
      x: 100, y: height - 120, size: 14, font: fontBold
    });
    page.drawText('JURISDICTION AND ENFORCEMENT ACT (UCCJEA)', {
      x: 80, y: height - 140, size: 12, font: fontBold
    });
    page.drawText('FL-105', { x: 520, y: height - 120, size: 10, font });

    // Case number
    page.drawText('CASE NUMBER:', { x: 400, y: height - 180, size: 10, font });
    page.drawText(formData.case_number || '__________________', {
      x: 480, y: height - 180, size: 10, font
    });

    // Child info
    y = height - 220;
    page.drawText('Child Information:', { x: 50, y, size: 11, font: fontBold });
    y -= 20;
    page.drawText(`Name: ${formData.minor_name || formData.minor_full_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 15;
    page.drawText(`Date of Birth: ${formData.minor_date_of_birth || formData.minor_dob || '__________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 15;
    page.drawText(`Country of Birth: ${formData.country_of_birth || '__________'}`, {
      x: 70, y, size: 10, font
    });

    // Residence
    y -= 30;
    page.drawText('Residence Information:', { x: 50, y, size: 11, font: fontBold });
    y -= 20;
    page.drawText('Current address:', { x: 70, y, size: 10, font });
    y -= 15;
    page.drawText(formData.minor_address || '_____________________', { x: 70, y, size: 10, font });

    // Signature
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 100, size: 9, font });
    page.drawText('Signature: _____________________', { x: 300, y: 100, size: 9, font });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate GC-020 (Notice of Hearing)
   */
  async generateGC020(formData: CourtFormData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let y = height - 50;

    // Court info
    page.drawText('SUPERIOR COURT OF CALIFORNIA', { x: 350, y, size: 10, font });
    page.drawText(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, {
      x: 350, y: y - 15, size: 10, font
    });

    // Title
    page.drawText('NOTICE OF HEARING—GUARDIANSHIP', {
      x: 150, y: height - 120, size: 14, font: fontBold
    });
    page.drawText('GC-020', { x: 520, y: height - 120, size: 10, font });

    // Case number
    page.drawText('CASE NUMBER:', { x: 400, y: height - 180, size: 10, font });
    page.drawText(formData.case_number || '__________________', {
      x: 480, y: height - 180, size: 10, font
    });

    // Notice
    y = height - 220;
    page.drawText('Notice is given that:', { x: 50, y, size: 11, font: fontBold });
    y -= 30;
    page.drawText(`Minor: ${formData.minor_name || formData.minor_full_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });
    y -= 25;
    page.drawText(`Petitioner: ${formData.guardian_name || '_____________________'}`, {
      x: 70, y, size: 10, font
    });

    // Hearing details
    y -= 40;
    page.drawText('HEARING DETAILS:', { x: 50, y, size: 11, font: fontBold });
    y -= 25;
    page.drawText('Date: _______________', { x: 70, y, size: 10, font });
    y -= 20;
    page.drawText('Time: _______________', { x: 70, y, size: 10, font });
    y -= 20;
    page.drawText('Department: _________', { x: 70, y, size: 10, font });

    // Note
    y -= 40;
    page.drawText('Note: Hearing date and time will be set by the court clerk.', {
      x: 70, y, size: 9, font: fontBold
    });

    // Clerk signature
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 100, size: 9, font });
    page.drawText('Clerk of the Court', { x: 300, y: 100, size: 9, font });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

// Export singleton instance
export const vercelPDFGenerator = new VercelPDFGenerator();
