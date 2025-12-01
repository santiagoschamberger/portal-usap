# Testing Deal Conversion

## Steps to Debug:

1. Check Railway logs for:
   - "Deal webhook received"
   - "Found lead by email"
   - Any error messages

2. Check Zoho Deals module:
   - Does the deal exist?
   - What's the deal name?
   - What's the stage?

3. Check the webhook in Zoho:
   - Go to Setup → Automation → Workflow Rules
   - Click on "2.0 Deals sync"
   - Check "View Usage" to see if it fired

4. Manual test:
   - Edit any existing deal in Zoho
   - Change its stage
   - Check if webhook fires

## Common Issues:

- Webhook didn't fire (check Zoho workflow usage)
- Email field is null (check webhook body includes Email)
- Lead matching failed (check backend logs)
- Deal already existed (won't delete lead on update)

