/**
 * Serverless PDF Generator for California Court Forms
 *
 * Uses PDFKit which works in Vercel serverless functions (unlike Puppeteer)
 * Generates professional court-ready PDFs without requiring Chrome/Chromium
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface CourtFormData {
  [key: string]: any;
}

export class ServerlessPDFGenerator {
  /**
   * Generate GC-210 (Petition for Appointment of Guardian)
   */
  async generateGC210(formData: CourtFormData): Promise<Buffer> {
    return this.createPDF((doc) => {
      // Form header
      doc.fontSize(10).text('ATTORNEY OR PARTY WITHOUT ATTORNEY:', 50, 50);
      doc.fontSize(9).text(formData.attorney_name || '_____________________', 50, 65);
      doc.text(formData.attorney_address || '_____________________', 50, 75);

      // Court information
      doc.fontSize(10).text('SUPERIOR COURT OF CALIFORNIA', 350, 50);
      doc.text(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, 350, 65);

      // Form title
      doc.fontSize(14).font('Helvetica-Bold')
         .text('PETITION FOR APPOINTMENT OF GUARDIAN', 50, 120, { align: 'center' });
      doc.fontSize(12).text('OF THE PERSON', 50, 140, { align: 'center' });

      // Form number
      doc.fontSize(10).font('Helvetica')
         .text('GC-210', 520, 120);

      // Case number
      doc.text('CASE NUMBER:', 400, 180);
      doc.text(formData.case_number || '__________________', 480, 180);

      // Minor information section
      let y = 220;
      doc.fontSize(11).font('Helvetica-Bold').text('1. Minor Information:', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${formData.minor_name || formData.minor_full_name || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`Date of Birth: ${formData.minor_date_of_birth || formData.minor_dob || '__________'}`, 70, y);
      y += 15;
      doc.text(`Gender: ${formData.minor_gender || '__________'}`, 70, y);
      y += 15;
      doc.text(`Address: ${formData.minor_address || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`City, State, ZIP: ${formData.minor_city || '__________'}, ${formData.minor_state || '__'} ${formData.minor_zip || '_____'}`, 70, y);

      // Guardian information section
      y += 30;
      doc.fontSize(11).font('Helvetica-Bold').text('2. Proposed Guardian:', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${formData.guardian_name || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`Address: ${formData.guardian_address || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`Relationship to minor: ${formData.guardian_relationship || '__________'}`, 70, y);
      y += 15;
      doc.text(`Phone: ${formData.guardian_phone || '__________'}`, 70, y);

      // Parents information
      y += 30;
      doc.fontSize(11).font('Helvetica-Bold').text('3. Parents:', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Mother: ${formData.mother_name || formData.mother_full_name || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`Address: ${formData.mother_address || '__________'}`, 70, y);
      y += 15;
      doc.text(`Status: ${formData.mother_status || '__________'}`, 70, y);

      y += 20;
      doc.text(`Father: ${formData.father_name || formData.father_full_name || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`Address: ${formData.father_address || '__________'}`, 70, y);
      y += 15;
      doc.text(`Status: ${formData.father_status || '__________'}`, 70, y);

      // Signature section
      doc.fontSize(9).text(`Date: ${new Date().toLocaleDateString()}`, 50, 700);
      doc.text('Signature: _____________________', 300, 700);
    });
  }

  /**
   * Generate GC-220 (SIJS Findings)
   */
  async generateGC220(formData: CourtFormData): Promise<Buffer> {
    return this.createPDF((doc) => {
      // Court information
      doc.fontSize(10).text('SUPERIOR COURT OF CALIFORNIA', 350, 50);
      doc.text(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, 350, 65);

      // Form title
      doc.fontSize(14).font('Helvetica-Bold')
         .text('FINDINGS AND ORDERS AFTER HEARING', 50, 120, { align: 'center' });
      doc.fontSize(12).text('SPECIAL IMMIGRANT JUVENILE STATUS', 50, 140, { align: 'center' });

      // Form number
      doc.fontSize(10).font('Helvetica').text('GC-220', 520, 120);

      // Case number
      doc.text('CASE NUMBER:', 400, 180);
      doc.text(formData.case_number || '__________________', 480, 180);

      // Minor information
      let y = 220;
      doc.fontSize(11).font('Helvetica-Bold').text('Minor:', 50, y);
      doc.fontSize(10).font('Helvetica')
         .text(formData.minor_name || formData.minor_full_name || '_____________________', 120, y);

      // SIJS Findings
      y += 40;
      doc.fontSize(11).font('Helvetica-Bold').text('FINDINGS:', 50, y);
      y += 25;

      doc.fontSize(10).font('Helvetica');
      doc.text('☐', 60, y);
      doc.text('It is in the best interest of the minor that the court make the orders requested.', 80, y);
      y += 20;

      doc.text('☐', 60, y);
      doc.text('Reunification with one or both parents is not viable due to:', 80, y);
      y += 15;
      doc.fontSize(9).text(formData.sijs_reunification_reason || '__________', 100, y, { width: 420 });

      y += 50;
      doc.fontSize(10);
      doc.text('☐', 60, y);
      doc.text('It would not be in the minor\'s best interest to be returned to their country of origin.', 80, y);
      y += 20;

      doc.text('Reason:', 80, y);
      y += 15;
      doc.fontSize(9).text(formData.sijs_return_reason || '__________', 100, y, { width: 420 });

      // Judge signature
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, 50, 700);
      doc.text('JUDGE OF THE SUPERIOR COURT', 300, 700);
    });
  }

  /**
   * Generate FL-105 (UCCJEA Declaration)
   */
  async generateFL105(formData: CourtFormData): Promise<Buffer> {
    return this.createPDF((doc) => {
      // Court information
      doc.fontSize(10).text('SUPERIOR COURT OF CALIFORNIA', 350, 50);
      doc.text(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, 350, 65);

      // Form title
      doc.fontSize(14).font('Helvetica-Bold')
         .text('DECLARATION UNDER UNIFORM CHILD CUSTODY', 50, 120, { align: 'center' });
      doc.fontSize(12).text('JURISDICTION AND ENFORCEMENT ACT (UCCJEA)', 50, 140, { align: 'center' });

      // Form number
      doc.fontSize(10).font('Helvetica').text('FL-105', 520, 120);

      // Case number
      doc.text('CASE NUMBER:', 400, 180);
      doc.text(formData.case_number || '__________________', 480, 180);

      let y = 220;
      doc.fontSize(11).font('Helvetica-Bold').text('Child Information:', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${formData.minor_name || formData.minor_full_name || '_____________________'}`, 70, y);
      y += 15;
      doc.text(`Date of Birth: ${formData.minor_date_of_birth || formData.minor_dob || '__________'}`, 70, y);
      y += 15;
      doc.text(`Country of Birth: ${formData.country_of_birth || '__________'}`, 70, y);

      y += 30;
      doc.fontSize(11).font('Helvetica-Bold').text('Residence Information:', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text('Current address (last 5 years):', 70, y);
      y += 15;
      doc.text(formData.minor_address || '_____________________', 70, y);
      y += 15;
      doc.text(`From: ${formData.residence_from || '__________'} To: ${formData.residence_to || 'Present'}`, 70, y);

      y += 30;
      doc.fontSize(11).font('Helvetica-Bold').text('Custody Proceedings:', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text('☐ No other court proceedings concerning custody', 70, y);
      y += 15;
      doc.text('☐ Other proceedings (specify):', 70, y);

      // Signature
      doc.fontSize(9).text(`Date: ${new Date().toLocaleDateString()}`, 50, 700);
      doc.text('Signature: _____________________', 300, 700);
    });
  }

  /**
   * Generate GC-020 (Notice of Hearing)
   */
  async generateGC020(formData: CourtFormData): Promise<Buffer> {
    return this.createPDF((doc) => {
      // Court information
      doc.fontSize(10).text('SUPERIOR COURT OF CALIFORNIA', 350, 50);
      doc.text(`COUNTY OF ${(formData.filing_county || '________').toUpperCase()}`, 350, 65);

      // Form title
      doc.fontSize(14).font('Helvetica-Bold')
         .text('NOTICE OF HEARING—GUARDIANSHIP', 50, 120, { align: 'center' });

      // Form number
      doc.fontSize(10).font('Helvetica').text('GC-020', 520, 120);

      // Case number
      doc.text('CASE NUMBER:', 400, 180);
      doc.text(formData.case_number || '__________________', 480, 180);

      let y = 220;
      doc.fontSize(11).font('Helvetica-Bold').text('Notice is given that:', 50, y);
      y += 30;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Minor: ${formData.minor_name || formData.minor_full_name || '_____________________'}`, 70, y);
      y += 25;
      doc.text(`Petitioner: ${formData.guardian_name || '_____________________'}`, 70, y);

      y += 40;
      doc.fontSize(11).font('Helvetica-Bold').text('HEARING DETAILS:', 50, y);
      y += 25;

      doc.fontSize(10).font('Helvetica');
      doc.text('Date: _______________', 70, y);
      y += 20;
      doc.text('Time: _______________', 70, y);
      y += 20;
      doc.text('Department: _________', 70, y);
      y += 20;
      doc.text('Room: _______________', 70, y);

      y += 40;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Note: Hearing date and time will be set by the court clerk.', 70, y);

      // Clerk signature
      doc.fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, 50, 700);
      doc.text('Clerk of the Court', 300, 700);
    });
  }

  /**
   * Create a PDF using PDFKit with a callback for content
   */
  private createPDF(contentCallback: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: {
            top: 36,    // 0.5 inch
            bottom: 36,
            left: 36,
            right: 36
          }
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate content
        contentCallback(doc);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export singleton instance
export const serverlessPDFGenerator = new ServerlessPDFGenerator();
