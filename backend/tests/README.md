# Test Files

This directory contains test scripts for various backend functionality.

## Test Files

- `test-zoho-*.js/ts` - Zoho CRM integration tests
- `test-deals-endpoint.js` - Deals API endpoint tests
- `test-complete-flow.js` - End-to-end flow tests
- `test-socket.js` - WebSocket functionality tests

## Running Tests

```bash
# Run specific test
node tests/test-zoho-simple.js

# Run TypeScript tests
npx ts-node tests/test-zoho-comprehensive.ts
```

## Note

These are manual test scripts for development and debugging.
For production testing, use proper test frameworks like Jest or Mocha.

