import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailFormData {
  recipientEmail: string;
  recipientName: string;
  caseId: string;
  formData: any;
}

export class EmailService {
  /**
   * Send guardianship case form data via email
   */
  static async sendFormData(data: EmailFormData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`Sending guardianship form data to ${data.recipientEmail} for case ${data.caseId}`);

      // Create email content with form summary
      const emailContent = this.createEmailContent(data);

      // Send email using Resend (no attachments)
      const result = await resend.emails.send({
        from: 'Entrada Legal Forms <onboarding@resend.dev>',
        to: [data.recipientEmail],
        subject: `Your California Guardianship Case Data - Case ${data.caseId}`,
        html: emailContent.html,
        text: emailContent.text
      });

      console.log(`Resend API response:`, result);
      console.log(`Email sent successfully. Message ID: ${result.data?.id}`);

      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error) {
      console.error('Email sending error:', error);
      console.error('Error details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Create HTML and text content for the email
   */
  private static createEmailContent(data: EmailFormData): { html: string; text: string } {
    const formData = data.formData || {};

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>California Guardianship Forms</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; color: #2563eb; margin-bottom: 30px; }
    .section { margin-bottom: 25px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; margin-left: 10px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    .attachments { background-color: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ California Guardianship Case</h1>
      <p>Your form data summary</p>
    </div>

    <div class="section">
      <h2>Case Information</h2>
      <div class="field"><span class="label">Case ID:</span><span class="value">${data.caseId}</span></div>
      <div class="field"><span class="label">Filing County:</span><span class="value">${formData.filing_county || 'Not specified'}</span></div>
      <div class="field"><span class="label">Generated:</span><span class="value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
    </div>

    <div class="section">
      <h2>Minor Information</h2>
      <div class="field"><span class="label">Name:</span><span class="value">${formData.minor_name || 'Not provided'}</span></div>
      <div class="field"><span class="label">Date of Birth:</span><span class="value">${formData.minor_dob || 'Not provided'}</span></div>
      <div class="field"><span class="label">Country of Birth:</span><span class="value">${formData.country_of_birth || 'Not provided'}</span></div>
    </div>

    <div class="section">
      <h2>Guardian Information</h2>
      <div class="field"><span class="label">Name:</span><span class="value">${formData.guardian_name || 'Not provided'}</span></div>
      <div class="field"><span class="label">Relationship:</span><span class="value">${formData.guardian_relationship || 'Not provided'}</span></div>
      <div class="field"><span class="label">Address:</span><span class="value">${formData.guardian_address || 'Not provided'}</span></div>
      <div class="field"><span class="label">Phone:</span><span class="value">${formData.guardian_phone || 'Not provided'}</span></div>
    </div>

    <div class="section">
      <h2>SIJS Factors</h2>
      <div class="field"><span class="label">Best Interest Finding:</span><span class="value">${formData.sijs_best_interest || 'Not specified'}</span></div>
      <div class="field"><span class="label">Return Harmful:</span><span class="value">${formData.return_harmful || 'Not specified'}</span></div>
    </div>

    <div class="attachments">
      <h3>📋 Complete Form Data Summary</h3>
      <p>Below is your complete California guardianship case information as provided:</p>
      <p><em>You can use this data to prepare your legal documents for court filing.</em></p>
    </div>

    <div class="footer">
      <p>Generated by <strong>Entrada</strong> - California Guardianship Forms</p>
      <p>This email contains confidential legal documents. Please handle with care.</p>
      <p><small>If you received this email in error, please delete it immediately.</small></p>
    </div>
  </div>
</body>
</html>`;

    const text = `
California Guardianship Case - Case ${data.caseId}

Your complete form data summary is provided below:

CASE INFORMATION
- Case ID: ${data.caseId}
- Filing County: ${formData.filing_county || 'Not specified'}
- Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

MINOR INFORMATION
- Name: ${formData.minor_name || 'Not provided'}
- Date of Birth: ${formData.minor_dob || 'Not provided'}
- Country of Birth: ${formData.country_of_birth || 'Not provided'}

GUARDIAN INFORMATION
- Name: ${formData.guardian_name || 'Not provided'}
- Relationship: ${formData.guardian_relationship || 'Not provided'}
- Address: ${formData.guardian_address || 'Not provided'}
- Phone: ${formData.guardian_phone || 'Not provided'}

SIJS FACTORS
- Best Interest Finding: ${formData.sijs_best_interest || 'Not specified'}
- Return Harmful: ${formData.return_harmful || 'Not specified'}

FORM DATA SUMMARY
All information provided for your California guardianship case is shown above.

Note: Use this data to prepare your legal documents for court filing.

Generated by Entrada - California Guardianship Forms
This email contains confidential legal documents. Please handle with care.
`;

    return { html, text };
  }

  /**
   * Validate email configuration
   */
  static validateConfiguration(): boolean {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('Resend API key not found. Please set RESEND_API_KEY environment variable.');
      return false;
    }

    if (apiKey === 'your_resend_api_key_here') {
      console.error('Resend API key not configured. Please update environment variable with actual API key.');
      return false;
    }

    return true;
  }
}

export default EmailService;