/**
 * Test HTML-to-PDF Generation
 */

import { htmlPDFGenerator } from './lib/html-pdf-generator.ts';
import fs from 'fs';

const testData = {
  // Court information
  filing_county: 'Los Angeles',
  court_address: '111 N Hill St',
  court_city_zip: 'Los Angeles, CA 90012',
  court_branch: 'Stanley Mosk Courthouse',
  case_number: 'TEST-2025-001',

  // Guardian information
  guardian_name: 'Jane Smith',
  guardian_address: '123 Main Street, Los Angeles, CA 90001',
  guardian_phone: '(323) 555-0100',
  guardian_email: 'jane.smith@email.com',
  guardian_relationship: 'Aunt',
  guardian_type: 'person',
  is_relative: true,

  // Minor information
  minor_name: 'John Doe',
  minor_full_name: 'John Michael Doe',
  minor_dob: '05/15/2010',
  minor_date_of_birth: '05/15/2010',
  minor_address: '456 Oak Avenue, Los Angeles, CA 90002',
  minor_current_address: '456 Oak Avenue, Los Angeles, CA 90002',

  // Parent information
  mother_name: 'Mary Doe',
  mother_full_name: 'Mary Elizabeth Doe',
  father_name: 'Robert Doe',
  father_full_name: 'Robert James Doe',

  // SIJS factors
  sijs_best_interest: true,
  sijs_return_harmful: true,
  best_interest_explanation: 'Minor has established strong ties in the community and is thriving in school. Return would disrupt educational progress and emotional wellbeing.',
  return_harmful_explanation: 'Country of origin lacks adequate resources for minor. No family support available.',
  sijs_abuse: false,
  sijs_neglect: true,
  sijs_abandonment: true,
};

async function testHTMLPDFGeneration() {
  console.log('\n🧪 Testing HTML-to-PDF Generation\n');

  try {
    // Test GC-210
    console.log('📄 Generating GC-210...');
    const gc210 = await htmlPDFGenerator.generateGC210(testData);
    fs.writeFileSync('test-output-GC-210-html.pdf', gc210);
    console.log(`✅ GC-210 generated: ${gc210.length} bytes → test-output-GC-210-html.pdf`);

    // Test GC-220
    console.log('\n📄 Generating GC-220...');
    const gc220 = await htmlPDFGenerator.generateGC220(testData);
    fs.writeFileSync('test-output-GC-220-html.pdf', gc220);
    console.log(`✅ GC-220 generated: ${gc220.length} bytes → test-output-GC-220-html.pdf`);

    // Test FL-105
    console.log('\n📄 Generating FL-105...');
    const fl105 = await htmlPDFGenerator.generateFL105(testData);
    fs.writeFileSync('test-output-FL-105-html.pdf', fl105);
    console.log(`✅ FL-105 generated: ${fl105.length} bytes → test-output-FL-105-html.pdf`);

    // Test GC-020
    console.log('\n📄 Generating GC-020...');
    const gc020 = await htmlPDFGenerator.generateGC020(testData);
    fs.writeFileSync('test-output-GC-020-html.pdf', gc020);
    console.log(`✅ GC-020 generated: ${gc020.length} bytes → test-output-GC-020-html.pdf`);

    console.log('\n✅ All PDFs generated successfully!');
    console.log('\n📂 Output files:');
    console.log('   - test-output-GC-210-html.pdf');
    console.log('   - test-output-GC-220-html.pdf');
    console.log('   - test-output-FL-105-html.pdf');
    console.log('   - test-output-GC-020-html.pdf');
    console.log('\nOpen these files to verify the content.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

console.log('Starting HTML-to-PDF test...\n');
testHTMLPDFGeneration()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  });
