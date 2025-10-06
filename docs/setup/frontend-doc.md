# USA Payments Referral System - Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Application Architecture](#application-architecture)
3. [Authentication System](#authentication-system)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Screen-by-Screen Analysis](#screen-by-screen-analysis)
6. [Navigation Structure](#navigation-structure)
7. [Component Architecture](#component-architecture)
8. [API Integration](#api-integration)
9. [State Management](#state-management)
10. [Technical Stack](#technical-stack)

## Overview

The USA Payments Referral System is a comprehensive web application built with React and TypeScript that manages a partner referral program. The system allows partners to submit referrals, track their performance, manage team members, and provides administrative tools for system management.

### Key Business Functions
- **Referral Management**: Submit and track business referrals
- **Partner Program**: Manage partner relationships and compensation
- **Team Management**: Handle sub-accounts and team members
- **Educational Resources**: Provide training materials and tutorials
- **Administrative Tools**: System configuration and user management

## Application Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v6 with lazy loading
- **Styling**: Tailwind CSS with custom components
- **Forms**: React Hook Form with validation
- **State Management**: Zustand for global state
- **HTTP Client**: Axios with custom API layer
- **Icons**: Lucide React
- **Build Tool**: Vite

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── form/           # Form-specific components
│   ├── referrals/      # Referral-related components
│   ├── routes/         # Route protection components
│   └── ui/             # Generic UI components
├── config/             # Configuration files
├── constants/          # Application constants
├── hooks/              # Custom React hooks
├── pages/              # Screen components
│   └── admin/          # Admin-specific pages
├── services/           # API services and integrations
├── store/              # State management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Authentication System

### Authentication Flow
1. **Login Process**: Email/password authentication with JWT tokens
2. **Role-based Redirection**: Automatic routing based on user role
3. **Token Management**: Automatic token refresh and storage
4. **Protected Routes**: Route guards based on authentication status and roles

### Password Management
- **Forgot Password**: Email-based password reset initiation
- **Reset Password**: Secure token-based password reset completion
- **Admin Password Reset**: Administrative password reset capabilities

## User Roles & Permissions

### Role Hierarchy
1. **Admin**: Full system access and management capabilities
2. **User**: Partner with referral and team management capabilities
3. **Contact**: Limited access team member under a partner

### Permission Matrix
| Feature | Admin | User | Contact |
|---------|-------|------|---------|
| View Dashboard | ✅ | ✅ | ✅ (Limited) |
| Submit Referrals | ✅ | ✅ | ❌ |
| Manage Sub-accounts | ✅ | ✅ | ❌ |
| View Compensation | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Tutorial Management | ✅ | ❌ | ❌ |

## Screen-by-Screen Analysis

### Authentication Screens

#### 1. Login Screen (`/login`)
**File**: `src/pages/Login.tsx`

**Purpose**: Primary authentication entry point for all users.

**Functionality**:
- Email and password validation using React Hook Form
- Role-based redirection after successful authentication
- Error handling for invalid credentials
- Loading states during authentication
- Link to forgot password functionality

**UI Components**:
- Company logo display
- Email input with validation
- Password input with validation
- Submit button with loading state
- Forgot password link
- Error message display

**Form Validation**:
- Email format validation with regex pattern
- Required field validation
- Real-time error display

**API Integration**:
- `POST /auth/login` - User authentication
- JWT token storage in localStorage
- Automatic role detection and routing

---

#### 2. Forgot Password Screen (`/forgot-password`)
**File**: `src/pages/ForgotPassword.tsx`

**Purpose**: Initiate password recovery process for users who cannot access their accounts.

**Functionality**:
- Email submission for password reset
- Success confirmation display
- Error handling for invalid emails or system errors
- Return to login navigation

**UI Components**:
- Email input form
- Submit button with loading animation
- Success message screen
- Error message display
- Navigation back to login

**API Integration**:
- `POST /users/forgot-password` - Initiate password reset
- Email service integration for reset link delivery

---

#### 3. Reset Password Screen (`/reset-password`)
**File**: `src/pages/ResetPassword.tsx`

**Purpose**: Complete the password reset process using email token.

**Functionality**:
- Token validation from URL parameters
- New password creation with confirmation
- Password strength requirements
- Redirect to login after successful reset

**Form Validation**:
- Minimum 8 character password requirement
- Password confirmation matching
- Token presence validation

**UI Components**:
- New password input
- Confirm password input
- Submit button with loading state
- Token validation error handling

**API Integration**:
- `POST /users/reset-password` - Complete password reset
- Token validation and password update

---

#### 4. Register Screen (`/register`) - *Currently Disabled*
**File**: `src/pages/Register.tsx`

**Purpose**: New user account creation (currently commented out in routing).

**Functionality** (When Enabled):
- Full name, email, and password collection
- Password confirmation validation
- Account creation with email verification
- Automatic login after registration

**Note**: Registration is currently handled through admin invitation system rather than public registration.

---

### User Dashboard Screens

#### 5. Main Dashboard (`/dashboard`)
**File**: `src/pages/Dashboard.tsx`

**Purpose**: Central hub for user activity, metrics, and referral management.

**Functionality**:
- **Role-based Content**:
  - **Users**: Full dashboard with stats, referrals, deals, and sub-account data
  - **Contacts**: Simplified view showing only assigned deals
- **Key Metrics Display**:
  - Total referrals count
  - Conversion rate percentage
  - Active leads count
  - Monthly growth indicators
- **Data Tables**:
  - Referral table with time period filtering
  - Deals table showing current opportunities
  - Sub-account referrals table
- **Time Period Filtering**: Filter data by different time ranges

**UI Components**:
- `StatsCard` components for metrics display
- `ReferralTable` with filtering capabilities
- `DealsTable` for opportunity tracking
- `ContactDealsTable` for contact role users
- `SubAccountReferralsTable` for team referrals
- `AsyncBoundary` for loading and error states

**Data Sources**:
- `useDashboardData` hook for data fetching
- Real-time statistics from backend APIs
- Filtered data based on user permissions

**API Integration**:
- Dashboard statistics endpoint
- Referral data with pagination
- Deals and opportunities data
- Sub-account referral tracking

---

#### 6. Submit Referral Screen (`/submit`)
**File**: `src/pages/SubmitReferral.tsx`

**Purpose**: Core business function - capturing and submitting new referrals.

**Functionality**:
- **Comprehensive Form**:
  - First and last name inputs
  - Email address with validation
  - Company name
  - Business type selection
  - Phone number with country code
  - Additional notes/description
- **Form Validation**:
  - Required field validation
  - Email format validation
  - Phone number formatting
- **Submission Process**:
  - Integration with Zoho CRM
  - Success confirmation display
  - Error handling and retry logic

**UI Components**:
- `BusinessTypeSelect` dropdown component
- `PhoneInput` with country code selection
- Form validation error displays
- Loading states during submission
- `SuccessMessage` component after submission
- Company branding and footer

**API Integration**:
- `zohoService.submitReferral()` - Direct Zoho CRM integration
- Phone number formatting utilities
- Form data validation and sanitization

**Business Logic**:
- Automatic phone number formatting based on country code
- Business type categorization
- Referral tracking and attribution

---

#### 7. Compensation Screen (`/compensation`)
**File**: `src/pages/Compensation.tsx`

**Purpose**: Track partner earnings and payout history.

**Current Status**: Uses mock data - real implementation pending

**Functionality**:
- **Earnings Overview**:
  - Total earnings display
  - Pending payouts amount
  - Last payout date
  - Monthly growth percentages
- **Payout History**:
  - Historical payout table
  - Payment status tracking
  - Date and amount records

**UI Components**:
- `StatsCard` components for earnings metrics
- Payout history table
- Status badges for payment states

**Future Implementation**:
- Real-time earnings calculation
- Integration with payment systems
- Detailed commission breakdowns
- Downloadable payout reports

---

#### 8. Sub Accounts Screen (`/sub-accounts`)
**File**: `src/pages/SubAccounts.tsx`

**Purpose**: Manage team members and contacts under a partner account.

**Functionality**:
- **Contact Management**:
  - List all contacts associated with partner
  - Add new contact users
  - View contact details and roles
- **User Administration**:
  - Reset passwords for team members
  - Update contact information
  - Manage access permissions
- **Modal Interactions**:
  - Add user modal with form
  - Password reset modal
  - Confirmation dialogs

**UI Components**:
- Contact list with pagination
- Add user modal with form validation
- Password reset modal
- Success/error message handling
- Loading states for async operations

**API Integration**:
- `GET /users/user/{uuid}/contacts` - Fetch partner contacts
- `POST /users/partner/add-contact` - Add new contact
- Password reset functionality for contacts

**Business Logic**:
- Partner-contact relationship management
- Role-based access control for contacts
- Team hierarchy maintenance

---

#### 9. Tutorials/Resources Screen (`/tutorials`)
**File**: `src/pages/Tutorials.tsx`

**Purpose**: Educational content and training materials for partners.

**Functionality**:
- **Tutorial Display**:
  - Grid layout of video tutorials
  - Embedded video players (iframe)
  - Tutorial descriptions with HTML content
- **Content Management**:
  - Public tutorial filtering
  - Dynamic content loading
  - Fallback messaging when no content available

**UI Components**:
- Tutorial grid layout
- Embedded video iframes
- Loading spinner
- "Coming soon" placeholder message
- Tutorial card components

**API Integration**:
- `tutorialService.getPublicTutorials()` - Fetch available tutorials
- Video content embedding
- Tutorial metadata display

**Content Structure**:
- Video tutorials with embedded players
- Rich text descriptions
- Public/private content filtering

---

#### 10. User Settings Screen (`/settings`)
**File**: `src/pages/UserSettings.tsx`

**Purpose**: Personal account configuration and preferences.

**Functionality**:
- **Facebook Pixel Configuration**:
  - Set Facebook Pixel ID for conversion tracking
  - Pixel ID validation (numbers only)
  - Integration with referral link tracking
- **Settings Management**:
  - Form validation and error handling
  - Success confirmation messaging
  - Loading states during updates

**UI Components**:
- Settings form with validation
- Input field for Pixel ID
- Success/error message display
- Save button with loading state

**API Integration**:
- `GET /users/user/get-pixel-id` - Fetch current pixel ID
- `PUT /users/update-pixel-id` - Update pixel ID setting

**Business Value**:
- Enables conversion tracking for partners
- Integrates with Facebook advertising campaigns
- Provides attribution for referral success

---

### Public Screens

#### 11. Public Referral Screen (`/referral/:uuid`)
**File**: `src/pages/PublicReferral.tsx`

**Purpose**: Public-facing referral submission without authentication requirement.

**Functionality**:
- **Public Referral Form**:
  - Business name and contact information
  - Phone number with country code selection
  - Business type categorization
  - SMS consent checkbox
  - Additional notes field
- **FAQ Section**:
  - Accordion-style frequently asked questions
  - Information about USA Payments services
  - Benefits of switching to USA Payments
- **Partner Attribution**:
  - UUID-based partner tracking
  - Referral link attribution
  - Commission tracking setup

**UI Components**:
- Comprehensive referral form
- `BusinessTypeSelect` component
- `PhoneInput` with country codes
- FAQ accordion interface
- Success message display
- Company branding and legal footer

**API Integration**:
- `submitPublicReferral()` - Public referral submission
- Partner UUID validation
- Contact link generation

**Business Logic**:
- Anonymous referral capture
- Partner commission attribution
- Lead qualification and routing

---

### Admin Screens

#### 12. Admin Dashboard (`/admin`)
**File**: `src/pages/admin/AdminDashboard.tsx`

**Purpose**: System overview and administrative monitoring.

**Functionality**:
- **System Statistics**:
  - Total users count
  - Active users count
  - Total tutorials available
  - User activity percentages
- **Recent Activity**:
  - Recent user registrations
  - User details and registration dates
  - System health indicators

**UI Components**:
- `StatsCard` components for system metrics
- Recent users list
- Loading and error states
- Administrative dashboard layout

**API Integration**:
- `useAdminStats` hook for system statistics
- User activity monitoring
- System health metrics

**Administrative Value**:
- System health monitoring
- User growth tracking
- Content availability overview

---

#### 13. User Management Screen (`/admin/users`)
**File**: `src/pages/admin/UserManagement.tsx`

**Purpose**: Comprehensive user administration and management.

**Functionality**:
- **User Administration**:
  - Paginated user list with search
  - Email-based user search
  - User details and role management
- **User Actions**:
  - Edit compensation links
  - Reset user passwords
  - Update Facebook Pixel IDs
  - Send password reset emails
- **Modal Management**:
  - Compensation link modal
  - Password update modal
  - Pixel ID update modal

**UI Components**:
- Paginated user table
- Search functionality with debouncing
- Action buttons for user management
- Modal components for user actions
- Success/error message handling

**API Integration**:
- `userService.getAllUsers()` - Paginated user fetching
- `userService.updatePixelId()` - Pixel ID management
- `userService.triggerPasswordReset()` - Password reset
- User search with debounced queries

**Administrative Features**:
- Bulk user operations
- User search and filtering
- Role-based user management
- Account maintenance tools

---

#### 14. Tutorial Management Screen (`/admin/tutorials`)
**File**: `src/pages/admin/TutorialManagement.tsx`

**Purpose**: Content management for educational resources.

**Functionality**:
- **Tutorial Administration**:
  - Create new tutorials
  - Edit existing tutorials
  - Delete tutorials with confirmation
  - Set public/private visibility
- **Content Management**:
  - Video link embedding
  - Rich text descriptions
  - Tutorial categorization
  - Publication status control

**UI Components**:
- Tutorial grid display
- `TutorialForm` component for CRUD operations
- Video preview capabilities
- Public/private status badges
- Action buttons (edit, delete)

**API Integration**:
- `tutorialService.getAllTutorials()` - Fetch all tutorials
- `tutorialService.createTutorial()` - Create new tutorial
- `tutorialService.updateTutorial()` - Update existing tutorial
- `tutorialService.deleteTutorial()` - Remove tutorial

**Content Features**:
- Video content management
- Rich text editing capabilities
- Publication workflow
- Content visibility control

---

#### 15. Admin Settings Screen (`/admin/settings`)
**File**: `src/pages/admin/Settings.tsx`

**Purpose**: System-wide configuration management.

**Functionality**:
- **Settings Administration**:
  - Create new system settings
  - Edit existing configurations
  - Delete settings with confirmation
  - Key-value pair management
- **Configuration Control**:
  - System behavior modification
  - Feature flag management
  - Application configuration

**UI Components**:
- Settings list display
- Create/edit setting forms
- Key-value input fields
- Confirmation dialogs for deletion
- Success/error handling

**API Integration**:
- `settingsService.getAllSettings()` - Fetch system settings
- `settingsService.createSetting()` - Create new setting
- `settingsService.updateSetting()` - Update existing setting
- `settingsService.deleteSetting()` - Remove setting

**Administrative Value**:
- System configuration without code deployment
- Feature flag management
- Behavioral parameter control

---

## Navigation Structure

### Layout Component (`src/components/Layout.tsx`)

The application uses a role-based navigation system with consistent layout across authenticated screens.

#### Navigation by Role

**Admin Navigation**:
- Dashboard (`/admin`)
- Users (`/admin/users`)
- Resources (`/admin/tutorials`)
- Settings (`/admin/settings`)

**User Navigation**:
- Dashboard (`/dashboard`)
- Resources (`/tutorials`)
- My Commissions (external link or disabled)
- Users (`/sub-accounts`)
- Copy Referral Link (utility button)
- Contact Us (external link)

**Contact Navigation**:
- Dashboard (`/dashboard`) - Limited view
- Resources (`/tutorials`)
- Contact Us (external link)

#### Common Navigation Features
- Company logo with home link
- Mobile-responsive hamburger menu
- "Submit Referral" button (prominent placement)
- Settings dropdown for users
- Logout functionality
- Active page highlighting

---

## Component Architecture

### Reusable Components

#### Form Components (`src/components/form/`)
- **BusinessTypeSelect**: Dropdown for business categorization
- **CountryCodeSelect**: Country code selection for phone numbers
- **FormError**: Consistent error message display
- **FormHelperText**: Helper text for form fields
- **FormLabel**: Standardized form labels
- **PhoneNumberInput**: Phone input with country code
- **SelectField**: Generic select field component

#### UI Components (`src/components/ui/`)
- **CopyLinkButton**: Referral link copying functionality
- **FloatingContactButton**: Persistent contact button
- **Tooltip**: Information tooltips

#### Referral Components (`src/components/referrals/`)
- **ReferralLink**: Referral link display and management
- **ReferralStatusBadge**: Status indication for referrals
- **ReferralTableHeader**: Table header with sorting
- **ReferralTablePagination**: Pagination controls
- **ReferralTableRow**: Individual referral row
- **SuccessMessage**: Success confirmation display

#### Route Components (`src/components/routes/`)
- **ProtectedRoute**: Authentication and role-based route protection
- **PublicRoute**: Routes for unauthenticated users

### Data Components
- **StatsCard**: Metric display with change indicators
- **LoadingSpinner**: Loading state indicator
- **ErrorBoundary**: Error handling wrapper
- **AsyncBoundary**: Loading and error state management

---

## API Integration

### Service Layer Architecture

#### Core Services (`src/services/`)
- **axios.ts**: HTTP client configuration with interceptors
- **userService.ts**: User management operations
- **tutorialService.ts**: Tutorial content management
- **settingsService.ts**: System settings management
- **zoho.ts**: Zoho CRM integration
- **adminService.ts**: Administrative operations
- **userProfileService.ts**: User profile management

#### API Structure (`src/services/api/`)
- **config.ts**: API configuration and endpoints
- **deals.ts**: Deal and opportunity management
- **errorHandler.ts**: Error handling utilities
- **errorMessages.ts**: Error message constants
- **leads.ts**: Lead management operations
- **referral.ts**: Referral submission and management
- **retryConfig.ts**: API retry logic
- **stats.ts**: Statistics and analytics
- **types.ts**: API type definitions

### Authentication Integration
- JWT token management
- Automatic token refresh
- Request interceptors for authentication
- Role-based API access control

### Error Handling
- Centralized error handling
- User-friendly error messages
- Retry logic for failed requests
- Network error recovery

---

## State Management

### Zustand Store (`src/store/`)

#### Auth Store (`authStore.ts`)
- User authentication state
- Login/logout functionality
- Token management
- Role-based permissions
- User profile data

#### Demo Users (`demoUsers.ts`)
- Development and testing user data
- Role-based demo accounts
- Testing scenarios

### Custom Hooks (`src/hooks/`)
- **useAdminStats**: Administrative statistics
- **useApi**: Generic API hook
- **useContactLink**: Contact link generation
- **useDashboardData**: Dashboard data fetching
- **useDebounce**: Input debouncing
- **useProfile**: User profile management

---

## Technical Stack Details

### Build and Development
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and developer experience
- **ESLint**: Code linting and quality
- **PostCSS**: CSS processing
- **Tailwind CSS**: Utility-first styling

### Dependencies
- **React Router**: Client-side routing with lazy loading
- **React Hook Form**: Form management and validation
- **Lucide React**: Icon library
- **Axios**: HTTP client
- **Zustand**: Lightweight state management

### Development Features
- Hot module replacement
- TypeScript strict mode
- Path-based code splitting
- Lazy loading for routes
- Development error boundaries

---

## Security Features

### Authentication Security
- JWT token-based authentication
- Secure token storage
- Automatic token refresh
- Session timeout handling

### Route Protection
- Role-based access control
- Protected route components
- Unauthorized access handling
- Automatic redirects

### Form Security
- Input validation and sanitization
- CSRF protection considerations
- XSS prevention
- Secure form submission

---

## Performance Optimizations

### Code Splitting
- Route-based lazy loading
- Component-level code splitting
- Dynamic imports for heavy components

### Data Loading
- Async boundaries for loading states
- Debounced search inputs
- Pagination for large datasets
- Caching strategies

### UI Performance
- Memoized components where appropriate
- Optimized re-renders
- Efficient state updates
- Loading state management

---

## Deployment Considerations

### Build Configuration
- Production build optimization
- Asset optimization
- Bundle size monitoring
- Environment variable management

### Browser Support
- Modern browser compatibility
- Progressive enhancement
- Responsive design
- Mobile-first approach

---

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced analytics dashboard
- Mobile application
- Enhanced reporting tools
- Integration with additional CRM systems

### Technical Improvements
- Enhanced error boundaries
- Performance monitoring
- A/B testing framework
- Advanced caching strategies
- Offline support capabilities

---

This documentation provides a comprehensive overview of the USA Payments Referral System frontend architecture, functionality, and implementation details. Each screen serves a specific business purpose within the referral program ecosystem, from public lead capture to administrative system management. 