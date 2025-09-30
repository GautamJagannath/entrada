/**
 * Direct PDF Service Test
 * Tests the PDF filling logic directly without needing database/auth
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

const testFormData = {
  // Court information
  'topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0].CrtCounty_ft[0]': 'Los Angeles',
  'CrtCounty_ft[0]': 'Los Angeles',
  'CaseNumber_ft[0]': 'TEST-001',

  // Attorney information
  'AttyName_ft[0]': 'Test Attorney',
  'Email_ft[0]': 'attorney@test.com',

  // Basic fields
  'FillText5[0]': 'Jane Smith', // Guardian
  'FillText6[0]': 'John Doe',   // Minor
  'FillText9[0]': '05/15/2010', // DOB
  'FillText3[0]': 'Mary Doe',   // Mother
  'FillTxt6[0]': 'Robert Doe',  // Father
};

async function testPDFFilling() {
  console.log('\n🧪 Direct PDF Service Test\n');

  try {
    // Load the PDF
    const templatePath = 'public/templates/GC-210.pdf';
    console.log(`📄 Loading ${templatePath}...`);

    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template not found: ${templatePath}`);
      return;
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    console.log(`✓ PDF loaded: ${pdfDoc.getPageCount()} pages`);

    // Try to get form
    let form;
    let fields;

    try {
      form = pdfDoc.getForm();
      fields = form.getFields();
      console.log(`✓ PDF has ${fields.length} form fields`);

      // List first 10 fields
      if (fields.length > 0) {
        console.log('\n📋 First 10 fields:');
        fields.slice(0, 10).forEach((field, idx) => {
          const name = field.getName();
          const type = field.constructor.name;
          console.log(`  ${idx + 1}. [${type}] ${name}`);
        });
      } else {
        console.log('\n⚠️  No fillable fields detected in PDF');
        console.log('    This PDF may use XFA forms or be flattened');
        console.log('    Text overlay method will be used instead');
      }
    } catch (error) {
      console.error('❌ Could not access form:', error.message);
      fields = [];
    }

    // Try to fill fields
    if (fields && fields.length > 0) {
      console.log('\n🖊️  Attempting to fill fields...\n');

      let successCount = 0;
      let failCount = 0;

      for (const [fieldName, value] of Object.entries(testFormData)) {
        try {
          const field = form.getField(fieldName);
          const fieldType = field.constructor.name;

          if (fieldType === 'PDFTextField') {
            const textField = form.getTextField(fieldName);
            textField.setText(value.toString());
            console.log(`  ✓ Filled: ${fieldName} = "${value}"`);
            successCount++;
          } else {
            console.log(`  ⚠️  Skipped (${fieldType}): ${fieldName}`);
            failCount++;
          }
        } catch (error) {
          console.log(`  ✗ Failed: ${fieldName} - ${error.message}`);
          failCount++;
        }
      }

      console.log(`\n📊 Results: ${successCount} filled, ${failCount} failed`);

      // Save the filled PDF
      const outputPath = 'test-output-GC-210.pdf';
      const filledBytes = await pdfDoc.save({ useObjectStreams: false });
      fs.writeFileSync(outputPath, filledBytes);

      console.log(`\n✅ Test PDF saved to: ${outputPath}`);
      console.log('   Open this file to verify fields are filled');
    } else {
      console.log('\n⚠️  Cannot test field filling - no fields detected');
      console.log('   This is expected if PDFs are XFA forms or flattened');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

console.log('Starting PDF test...');
testPDFFilling().then(() => {
  console.log('\n✅ Test complete');
}).catch(error => {
  console.error('\n❌ Test error:', error);
});
