import { NextRequest, NextResponse } from 'next/server';
import { californiaPDFService } from '@/lib/adobe-pdf-services';
import { getCase } from '@/lib/cases';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, forms } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // PDF service is always available with pdf-lib
    console.log('Using pdf-lib for California court form filling');

    // Get case data
    const caseData = await getCase(caseId);
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    console.log(`Generating PDFs for case ${caseId}...`);

    // Generate PDFs
    const generatedForms = await californiaPDFService.generateGuardianshipForms(caseData);

    // Convert buffers to base64 for JSON response
    const formsData: { [key: string]: { name: string; data: string; size: number } } = {};

    for (const [formType, buffer] of Object.entries(generatedForms)) {
      formsData[formType] = {
        name: `${formType}_${caseData.id}.pdf`,
        data: buffer.toString('base64'),
        size: buffer.length
      };
    }

    console.log(`Successfully generated ${Object.keys(generatedForms).length} PDF forms`);

    return NextResponse.json({
      success: true,
      caseId,
      forms: formsData,
      generatedAt: new Date().toISOString(),
      message: `Generated ${Object.keys(generatedForms).length} PDF forms successfully`
    });

  } catch (error) {
    console.error('PDF generation error:', error);

    return NextResponse.json(
      {
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check PDF service status
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      configured: true,
      status: 'ready',
      service: 'pdf-lib',
      message: 'California PDF Form Service ready with pdf-lib'
    });

  } catch (error) {
    console.error('Error checking PDF service status:', error);
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