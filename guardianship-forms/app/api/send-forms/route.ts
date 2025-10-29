import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { getCase } from '@/lib/cases';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, recipientEmail } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Validate email configuration
    if (!EmailService.validateConfiguration()) {
      return NextResponse.json(
        {
          error: 'Email service not configured',
          message: 'Email service credentials are not set up. Please contact administrator.'
        },
        { status: 503 }
      );
    }

    // Get case data
    const caseData = await getCase(caseId);
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    console.log(`Sending form data for case ${caseId} to ${recipientEmail}...`);

    // Send email with form data only (no PDFs)
    const emailResult = await EmailService.sendFormData({
      recipientEmail,
      recipientName: caseData.form_data?.guardian_name || 'Legal Guardian',
      caseId: caseData.id,
      formData: caseData.form_data
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: 'Email sending failed',
          message: emailResult.error || 'Unknown email error'
        },
        { status: 500 }
      );
    }

    console.log(`Successfully sent form data for case ${caseId} to ${recipientEmail}`);

    return NextResponse.json({
      success: true,
      caseId,
      recipientEmail,
      messageId: emailResult.messageId,
      sentAt: new Date().toISOString(),
      message: `Successfully sent case form data to ${recipientEmail}`
    });

  } catch (error) {
    console.error('Send forms error:', error);

    return NextResponse.json(
      {
        error: 'Failed to send forms',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check email service status
export async function GET(request: NextRequest) {
  try {
    const configured = EmailService.validateConfiguration();

    return NextResponse.json({
      configured,
      status: configured ? 'ready' : 'not_configured',
      service: 'resend',
      message: configured
        ? 'Email service ready with Resend'
        : 'Email service not configured'
    });

  } catch (error) {
    console.error('Error checking email service status:', error);
    return NextResponse.json(
      {
        configured: false,
        status: 'error',
        message: 'Error checking service status'
      },
      { status: 500 }
    );
  }
}