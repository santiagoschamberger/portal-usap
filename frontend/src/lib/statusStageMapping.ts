/**
 * Status/Stage normalization helpers
 *
 * The backend stores simplified "Portal display" values (Dec 2025 mapping):
 * - Leads: New, Contact Attempt, Contacted - In Progress, Sent for Signature, Application Signed, Lost
 * - Deals: In Underwriting, Conditionally Approved, Approved, Lost, Declined, Closed
 *
 * Some older records / UI code still uses legacy portal values (Phase 3),
 * so the frontend normalizes everything into the current Portal display values.
 */

const PORTAL_LEAD_STATUSES = new Set([
  'New',
  'Contact Attempt',
  'Contacted - In Progress',
  'Sent for Signature',
  'Application Signed',
  'Lost',
])

const PORTAL_DEAL_STAGES = new Set([
  'In Underwriting',
  'Conditionally Approved',
  'Approved',
  'Lost',
  'Declined',
  'Closed',
])

// Zoho Lead Status → Portal Lead Status
const ZOHO_LEAD_TO_PORTAL: Record<string, string> = {
  'New': 'New',
  'Contact Attempt 1': 'Contact Attempt',
  'Contact Attempt 2': 'Contact Attempt',
  'Contact Attempt 3': 'Contact Attempt',
  'Contact Attempt 4': 'Contact Attempt',
  'Contact Attempt 5': 'Contact Attempt',
  'Interested - Needs Follow Up': 'Contacted - In Progress',
  'Sent Pre-App': 'Contacted - In Progress',
  'Pre-App Received': 'Contacted - In Progress',
  'Awaiting Signature - No Motion.io': 'Sent for Signature',
  'Send to Motion.io': 'Sent for Signature',
  'Signed Application': 'Application Signed',
  'Notify Apps Team': 'Application Signed',
  'Convert': 'Application Signed',
  'Converted': 'Application Signed',
  'Converted - Deal': 'Application Signed',
  'Lost': 'Lost',
  'Junk': 'Lost',
}

// Legacy Portal Lead Status → Current Portal Lead Status (matches SQL migration in docs)
const LEGACY_PORTAL_LEAD_TO_CURRENT: Record<string, string> = {
  'Pre-Vet / New Lead': 'New',
  'Lead': 'New',
  'Contacted': 'Contact Attempt',
  'Sent for Signature / Submitted': 'Sent for Signature',
  'Sent for Signature / Submitted ': 'Sent for Signature',
  'Application Submitted': 'Sent for Signature',
  'Approved': 'Application Signed',
  'Declined': 'Lost',
  'Dead / Withdrawn': 'Lost',
}

// Zoho Deal Stage → Portal Deal Stage
const ZOHO_DEAL_TO_PORTAL: Record<string, string> = {
  'Sent to Underwriting': 'In Underwriting',
  'App Pended': 'In Underwriting',
  'Conditionally Approved': 'Conditionally Approved',
  'Approved': 'Approved',
  'App Withdrawn': 'Lost',
  'Merchant Unresponsive': 'Lost',
  'Dead/Do Not contact': 'Lost',
  'Dead / Do Not Contact': 'Lost',
  'Dead/Do Not Contact': 'Lost',
  'Declined': 'Declined',
  'Approved - Closed': 'Closed',
}

// Legacy Portal Deal Stage → Current Portal Deal Stage (matches SQL migration in docs)
const LEGACY_PORTAL_DEAL_TO_CURRENT: Record<string, string> = {
  'New Lead / Prevet': 'In Underwriting',
  'New Deal': 'In Underwriting',
  'Pre-Vet': 'In Underwriting',
  'Submitted': 'In Underwriting',
  'Underwriting': 'In Underwriting',
  'Conditionally Approved': 'Conditionally Approved',
  'Approved': 'Approved',
  'App Withdrawn': 'Lost',
  'Merchant Unresponsive': 'Lost',
  'Dead / Do Not Contact': 'Lost',
  'Dead/Do Not Contact': 'Lost',
  'Declined': 'Declined',
  'Closed': 'Closed',
  'Approved - Closed': 'Closed',
}

export function normalizeLeadStatus(input?: string | null): string {
  const raw = (input ?? '').trim()
  if (!raw) return 'New'

  if (PORTAL_LEAD_STATUSES.has(raw)) return raw
  if (LEGACY_PORTAL_LEAD_TO_CURRENT[raw]) return LEGACY_PORTAL_LEAD_TO_CURRENT[raw]
  if (ZOHO_LEAD_TO_PORTAL[raw]) return ZOHO_LEAD_TO_PORTAL[raw]

  // Safe fallback (keeps UI stable)
  return 'New'
}

export function normalizeDealStage(input?: string | null): string {
  const raw = (input ?? '').trim()
  if (!raw) return 'In Underwriting'

  if (PORTAL_DEAL_STAGES.has(raw)) return raw
  if (LEGACY_PORTAL_DEAL_TO_CURRENT[raw]) return LEGACY_PORTAL_DEAL_TO_CURRENT[raw]
  if (ZOHO_DEAL_TO_PORTAL[raw]) return ZOHO_DEAL_TO_PORTAL[raw]

  return 'In Underwriting'
}

