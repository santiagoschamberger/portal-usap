// User and Authentication Types
export interface User {
  id: string
  email: string
  role: 'admin' | 'user' | 'contact' | 'sub_account'
  partnerId?: string
  firstName?: string
  lastName?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface Partner {
  id: string
  zohoPartnerId?: string
  name: string
  email: string
  approved: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Lead and Referral Types
export interface Lead {
  id: string
  partnerId: string // Maps to partner_id in DB
  zohoLeadId?: string // Maps to zoho_lead_id
  firstName: string // Maps to first_name
  lastName: string // Maps to last_name
  email: string
  phone?: string
  company?: string
  businessType?: string // Maps to company (sometimes) or business_type
  status: string
  zoho_status?: string // Maps to zoho_status
  source: string // Maps to lead_source
  notes?: string
  createdBy: string // Maps to created_by
  createdAt: string // Maps to created_at
  updatedAt: string // Maps to updated_at
  creator?: { // Joined creator info
    id: string
    first_name: string
    last_name: string
    role: string
    email: string
  }
}

export interface LeadStatusHistory {
  id: string
  leadId: string
  oldStatus?: string
  newStatus: string
  changedBy: string
  changedAt: string
}

export interface CreateLeadDto {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  businessType?: string
  source: string
  notes?: string
}

// Dashboard and Stats Types
export interface DashboardStats {
  totalReferrals: number
  conversionRate: number
  activeLeads: number
  monthlyGrowth: number
  totalEarnings?: number
  pendingPayouts?: number
}

export interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon?: React.ReactNode
}

// Tutorial Types
export interface Tutorial {
  id: string
  title: string
  description: string
  videoUrl: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Settings Types
export interface UserSettings {
  facebookPixelId?: string
  notifications: {
    email: boolean
    sms: boolean
    browser: boolean
  }
}

export interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
  token: string
}

export interface SubmitReferralFormData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company: string
  businessType: string
  notes?: string
  smsConsent?: boolean
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  message?: string
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Navigation Types
export interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  external?: boolean
  roles?: ('admin' | 'user' | 'contact')[]
}

// Business Types
export const BUSINESS_TYPES = [
  'Restaurant',
  'Retail Store',
  'Service Business',
  'E-commerce',
  'Healthcare',
  'Professional Services',
  'Non-profit',
  'Other'
] as const

export type BusinessType = typeof BUSINESS_TYPES[number]

// Lead Status Types
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'closed-won',
  'closed-lost'
] as const

export type LeadStatus = typeof LEAD_STATUSES[number]

// Phone Country Codes
export interface CountryCode {
  code: string
  country: string
  flag: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' }
]
