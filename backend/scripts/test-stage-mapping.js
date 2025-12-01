const { StageMappingService } = require('../dist/services/stageMappingService');

console.log('Testing StageMappingService...');

const testCases = [
  { input: 'New Deal', expected: 'New Lead / Prevet' },
  { input: 'Pre-Vet', expected: 'New Lead / Prevet' },
  { input: 'Sent for Signature', expected: 'Submitted' },
  { input: 'Signed Application', expected: 'Submitted' },
  { input: 'Sent to Underwriting', expected: 'Underwriting' },
  { input: 'App Pended', expected: 'Underwriting' },
  { input: 'Approved', expected: 'Approved' },
  { input: 'Conditionally Approved', expected: 'Approved' },
  { input: 'Declined', expected: 'Declined' },
  { input: 'Approved - Closed', expected: 'Closed' },
  { input: 'Dead / Do Not Contact', expected: 'Closed' },
  { input: 'Merchant Unresponsive', expected: 'Closed' },
  { input: 'App Withdrawn', expected: 'Closed' },
  { input: 'Unknown Stage', expected: 'New Lead / Prevet' }, // Default
  { input: undefined, expected: 'New Lead / Prevet' } // Default
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = StageMappingService.mapFromZoho(input);
  if (result === expected) {
    console.log(`✅ Input: "${input}" -> Expected: "${expected}" -> Got: "${result}"`);
    passed++;
  } else {
    console.error(`❌ Input: "${input}" -> Expected: "${expected}" -> Got: "${result}"`);
    failed++;
  }
});

console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✨ StageMappingService verification successful!');
} else {
  console.error('⚠️ StageMappingService verification failed!');
  process.exit(1);
}

