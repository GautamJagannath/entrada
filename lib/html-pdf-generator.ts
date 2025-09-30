/**
 * HTML-to-PDF Generator for California Court Forms
 *
 * This approach generates PDFs from HTML templates that match the visual layout
 * of California court forms. This works around XFA form limitations.
 */

import puppeteer from 'puppeteer';

export interface CourtFormData {
  [key: string]: any;
}

export class HTMLPDFGenerator {
  /**
   * Generate a PDF from HTML template
   */
  async generatePDFFromHTML(
    htmlContent: string,
    options: {
      format?: 'Letter' | 'Legal';
      margin?: { top?: string; right?: string; bottom?: string; left?: string };
    } = {}
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'Letter',
        printBackground: true,
        margin: options.margin || {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate GC-210 (Petition for Appointment of Guardian)
   */
  async generateGC210(formData: CourtFormData): Promise<Buffer> {
    const html = this.createGC210HTML(formData);
    return this.generatePDFFromHTML(html);
  }

  /**
   * Generate GC-220 (SIJS Petition)
   */
  async generateGC220(formData: CourtFormData): Promise<Buffer> {
    const html = this.createGC220HTML(formData);
    return this.generatePDFFromHTML(html);
  }

  /**
   * Generate FL-105 (UCCJEA Declaration)
   */
  async generateFL105(formData: CourtFormData): Promise<Buffer> {
    const html = this.createFL105HTML(formData);
    return this.generatePDFFromHTML(html);
  }

  /**
   * Generate GC-020 (Notice of Hearing)
   */
  async generateGC020(formData: CourtFormData): Promise<Buffer> {
    const html = this.createGC020HTML(formData);
    return this.generatePDFFromHTML(html);
  }

  /**
   * Create HTML for GC-210 form
   */
  private createGC210HTML(data: CourtFormData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GC-210 - Petition for Appointment of Guardian</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }

    .form-header {
      text-align: right;
      font-size: 9pt;
      margin-bottom: 20px;
    }

    .court-info {
      border: 1px solid #000;
      padding: 10px;
      margin-bottom: 20px;
    }

    .case-number {
      border: 1px solid #000;
      padding: 10px;
      text-align: right;
      margin-bottom: 20px;
    }

    .form-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 20px 0;
    }

    .section {
      margin: 15px 0;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
    }

    .field-group {
      margin: 8px 0;
    }

    .field-label {
      display: inline-block;
      min-width: 150px;
      font-weight: normal;
    }

    .field-value {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 300px;
      padding: 0 5px;
    }

    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 5px;
      vertical-align: middle;
      text-align: center;
      line-height: 12px;
      font-size: 10pt;
    }

    .checkbox.checked::after {
      content: "✓";
    }

    .footer {
      position: fixed;
      bottom: 0;
      width: 100%;
      text-align: center;
      font-size: 9pt;
      padding: 10px 0;
      border-top: 1px solid #000;
    }
  </style>
</head>
<body>
  <!-- Form Header -->
  <div class="form-header">
    <strong>GC-210</strong><br>
    FOR COURT USE ONLY
  </div>

  <!-- Court Information -->
  <div class="court-info">
    <strong>SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${data.filing_county || '__________'}</strong><br>
    Street Address: ${data.court_address || '__________'}<br>
    Mailing Address: ${data.court_city_zip || '__________'}<br>
    Branch Name: ${data.court_branch || '__________'}
  </div>

  <!-- Case Number -->
  <div class="case-number">
    <strong>CASE NUMBER:</strong><br>
    ${data.case_number || '__________'}
  </div>

  <!-- Form Title -->
  <div class="form-title">
    PETITION FOR APPOINTMENT OF GUARDIAN<br>
    OF THE PERSON
  </div>

  <!-- Section 1: Petitioner -->
  <div class="section">
    <div class="section-title">1. PETITIONER (name of each):</div>
    <div class="field-group">
      <span class="field-value">${data.guardian_name || '__________'}</span>
    </div>
    <div class="field-group">
      requests that
      <span class="checkbox ${data.guardian_type === 'person' ? 'checked' : ''}"></span> (name):
      <span class="field-value">${data.guardian_name || '__________'}</span>
    </div>
    <div class="field-group">
      <span class="checkbox ${data.guardian_type === 'nonprofit' ? 'checked' : ''}"></span> (name of nonprofit charitable corporation):
      <span class="field-value">${data.guardian_nonprofit_name || '__________'}</span>
    </div>
    <div class="field-group">
      be appointed guardian of the PERSON of the minor.
    </div>
  </div>

  <!-- Section 2: Minor -->
  <div class="section">
    <div class="section-title">2. MINOR (name):</div>
    <div class="field-group">
      a. <span class="field-value">${data.minor_name || data.minor_full_name || '__________'}</span>
    </div>
    <div class="field-group">
      b. Date of birth: <span class="field-value">${data.minor_dob || data.minor_date_of_birth || '__________'}</span>
    </div>
    <div class="field-group">
      c. Address: <span class="field-value">${data.minor_address || data.minor_current_address || '__________'}</span>
    </div>
    <div class="field-group">
      d. <span class="checkbox ${data.is_relative ? 'checked' : ''}"></span> The minor is related to the proposed guardian as follows:
      <span class="field-value">${data.guardian_relationship || '__________'}</span>
    </div>
  </div>

  <!-- Section 3: Proposed Guardian -->
  <div class="section">
    <div class="section-title">3. PROPOSED GUARDIAN:</div>
    <div class="field-group">
      a. Address: <span class="field-value">${data.guardian_address || '__________'}</span>
    </div>
    <div class="field-group">
      b. Telephone: <span class="field-value">${data.guardian_phone || '__________'}</span>
    </div>
    <div class="field-group">
      c. Email: <span class="field-value">${data.guardian_email || '__________'}</span>
    </div>
  </div>

  <!-- Section 4: Parents -->
  <div class="section">
    <div class="section-title">4. PARENTS OF THE MINOR:</div>
    <div class="field-group">
      a. Mother's name: <span class="field-value">${data.mother_name || data.mother_full_name || '__________'}</span>
    </div>
    <div class="field-group">
      b. Father's name: <span class="field-value">${data.father_name || data.father_full_name || '__________'}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    GC-210 [Rev. January 1, 2023] PETITION FOR APPOINTMENT OF GUARDIAN OF THE PERSON
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Create HTML for GC-220 (SIJS Petition)
   */
  private createGC220HTML(data: CourtFormData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GC-220 - Request for Special Immigrant Juvenile Findings</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
    .form-header { text-align: right; font-size: 9pt; margin-bottom: 20px; }
    .court-info { border: 1px solid #000; padding: 10px; margin-bottom: 20px; }
    .case-number { border: 1px solid #000; padding: 10px; text-align: right; margin-bottom: 20px; }
    .form-title { text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; margin-bottom: 10px; }
    .field-group { margin: 8px 0; }
    .field-value { display: inline-block; border-bottom: 1px solid #000; min-width: 300px; padding: 0 5px; }
    .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; margin-right: 5px; }
    .checkbox.checked::after { content: "✓"; }
  </style>
</head>
<body>
  <div class="form-header"><strong>GC-220</strong></div>

  <div class="court-info">
    <strong>SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${data.filing_county || '__________'}</strong>
  </div>

  <div class="case-number">
    <strong>CASE NUMBER:</strong> ${data.case_number || '__________'}
  </div>

  <div class="form-title">
    REQUEST FOR SPECIAL IMMIGRANT JUVENILE FINDINGS
  </div>

  <div class="section">
    <div class="section-title">1. Minor's name:</div>
    <div class="field-value">${data.minor_name || data.minor_full_name || '__________'}</div>
  </div>

  <div class="section">
    <div class="section-title">2. FINDINGS REQUESTED:</div>
    <div class="field-group">
      <span class="checkbox ${data.sijs_best_interest ? 'checked' : ''}"></span>
      It is not in the minor's best interest to be returned to the minor's country of origin.
    </div>
    <div class="field-group">
      Explanation: <span class="field-value">${data.best_interest_explanation || '__________'}</span>
    </div>
  </div>

  <div class="section">
    <div class="field-group">
      <span class="checkbox ${data.sijs_return_harmful ? 'checked' : ''}"></span>
      The minor cannot reunify with one or both parents due to:
    </div>
    <div class="field-group">
      <span class="checkbox ${data.sijs_abuse ? 'checked' : ''}"></span> Abuse
      <span class="checkbox ${data.sijs_neglect ? 'checked' : ''}"></span> Neglect
      <span class="checkbox ${data.sijs_abandonment ? 'checked' : ''}"></span> Abandonment
    </div>
    <div class="field-group">
      Explanation: <span class="field-value">${data.return_harmful_explanation || '__________'}</span>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Create HTML for FL-105 (UCCJEA Declaration)
   */
  private createFL105HTML(data: CourtFormData): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FL-105 - Declaration Under UCCJEA</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    body { font-family: Arial, sans-serif; font-size: 11pt; }
    .form-title { text-align: center; font-weight: bold; font-size: 14pt; margin: 20px 0; }
    .field-value { border-bottom: 1px solid #000; min-width: 300px; padding: 0 5px; }
  </style>
</head>
<body>
  <div class="form-title">DECLARATION UNDER UNIFORM CHILD CUSTODY JURISDICTION AND ENFORCEMENT ACT (UCCJEA)</div>
  <p>Minor's name: <span class="field-value">${data.minor_name || data.minor_full_name || '__________'}</span></p>
  <p>Current address: <span class="field-value">${data.minor_address || data.minor_current_address || '__________'}</span></p>
</body>
</html>`;
  }

  /**
   * Create HTML for GC-020 (Notice of Hearing)
   */
  private createGC020HTML(data: CourtFormData): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GC-020 - Notice of Hearing</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    body { font-family: Arial, sans-serif; font-size: 11pt; }
    .form-title { text-align: center; font-weight: bold; font-size: 14pt; margin: 20px 0; }
    .field-value { border-bottom: 1px solid #000; min-width: 300px; padding: 0 5px; }
  </style>
</head>
<body>
  <div class="form-title">NOTICE OF HEARING—GUARDIANSHIP</div>
  <p>Minor's name: <span class="field-value">${data.minor_name || data.minor_full_name || '__________'}</span></p>
  <p>Guardian: <span class="field-value">${data.guardian_name || '__________'}</span></p>
  <p><strong>Note:</strong> Hearing date and time will be set by the court.</p>
</body>
</html>`;
  }
}

// Export singleton instance
export const htmlPDFGenerator = new HTMLPDFGenerator();
