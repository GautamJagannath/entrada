/**
 * Test PDF Generation
 *
 * This script tests the PDF generation with sample data
 */

const testData = {
  caseId: 'test-case-123',
  formData: {
    // Court information
    filing_county: 'Los Angeles',
    court_address: '111 N Hill St',
    court_city_zip: 'Los Angeles, CA 90012',

    // Attorney information (optional)
    attorney_name: '',
    attorney_bar_number: '',
    attorney_email: '',

    // Guardian information
    guardian_name: 'Jane Smith',
    guardian_address: '123 Main Street, Los Angeles, CA 90001',
    guardian_relationship: 'Aunt',

    // Minor information
    minor_name: 'John Doe',
    minor_full_name: 'John Doe',
    minor_dob: '2010-05-15',
    minor_date_of_birth: '05/15/2010',
    minor_address: '456 Oak Avenue, Los Angeles, CA 90002',
    minor_current_address: '456 Oak Avenue, Los Angeles, CA 90002',

    // Parent information
    mother_name: 'Mary Doe',
    mother_full_name: 'Mary Doe',
    mother_reunification: 'Not viable due to abandonment',

    father_name: 'Robert Doe',
    father_full_name: 'Robert Doe',
    father_reunification: 'Not viable - whereabouts unknown',

    // SIJS factors
    sijs_best_interest: true,
    sijs_return_harmful: true,
    best_interest_explanation: 'Minor has established strong ties in the community and is thriving in school. Return would disrupt educational progress and emotional wellbeing.',
    return_harmful_explanation: 'Country of origin lacks adequate resources for minor. No family support available.',

    sijs_abuse: false,
    sijs_neglect: true,
    sijs_abandonment: true,
  }
};

async function testPDFGeneration() {
  console.log('\n🧪 Testing PDF Generation with Sample Data\n');
  console.log('Sample case data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caseId: testData.caseId })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error:', error);
      return;
    }

    const result = await response.json();
    console.log('\n✅ Success!');
    console.log('Generated forms:', Object.keys(result.forms));
    console.log('Total forms:', result.forms ? Object.keys(result.forms).length : 0);
    console.log('\nCheck the browser console for detailed field filling logs.');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Note: This script assumes:
// 1. Dev server is running (npm run dev)
// 2. A test case exists in the database with ID 'test-case-123'
//
// To actually test:
// 1. Open http://localhost:3000
// 2. Login with Google
// 3. Create a new case
// 4. Fill out the interview form with the above data
// 5. Click "Generate PDFs" button
// 6. Check browser console for logs showing field filling attempts

console.log(`
📋 To test PDF generation:

1. Start dev server: npm run dev
2. Open http://localhost:3000
3. Login with Google SSO
4. Go to Dashboard
5. Click "Create New Case"
6. Fill out the interview form
7. Click "Generate PDFs" button
8. Open browser console to see detailed logs:
   - "✓ PDF has X form fields" - Shows detected fields
   - "✓ Filled text field: ..." - Shows successful field fills
   - "✓ Successfully filled X AcroForm fields" - Summary
9. Download the PDF and verify fields are filled

Expected behavior:
- If PDF has fillable fields: Uses form.getTextField() API
- If PDF has no fields: Falls back to text overlay method
- Either way, you should get a filled PDF

Sample data is defined above for testing.
`);
