# Partner Portal

A comprehensive partner management portal with Zoho CRM integration, built with Next.js 14+, Express.js, and Supabase PostgreSQL.

## 🏗️ Architecture

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, Zustand
- **Backend**: Express.js with TypeScript, Socket.IO for real-time features
- **Database**: Supabase PostgreSQL
- **CRM Integration**: Zoho CRM via NodeJS SDK
- **Email**: SendGrid for notifications
- **Authentication**: JWT with refresh tokens

## 📁 Project Structure

```
portal-usapayments-portal/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── docs/             # Documentation
├── memory-bank/      # Project memory and context
└── tasks/           # Task management files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Zoho CRM account
- SendGrid account (optional)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd portal-usapayments-portal
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend environment  
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

3. **Start development servers:**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend only (http://localhost:3000)
   npm run dev:backend   # Backend only (http://localhost:5000)
   ```

## 🔧 Environment Configuration

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here

# Zoho CRM Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REDIRECT_URI=your_zoho_redirect_uri

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourcompany.com
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏃‍♂️ Available Scripts

```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:frontend        # Start frontend only
npm run dev:backend         # Start backend only

# Production Build
npm run build               # Build both applications
npm run build:frontend      # Build frontend only
npm run build:backend       # Build backend only

# Production Start
npm start                   # Start both applications
npm run start:frontend      # Start frontend only
npm run start:backend       # Start backend only

# Code Quality
npm run lint                # Lint both applications
npm test                    # Run tests for both applications
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming Soon)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Partners (Coming Soon)
- `GET /api/partners` - List partners
- `POST /api/partners` - Create partner
- `GET /api/partners/:id` - Get partner details

### Leads (Coming Soon)
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `PATCH /api/leads/:id/status` - Update lead status

## 🔌 Real-time Features

The application uses Socket.IO for real-time features:
- Live lead status updates
- Real-time notifications
- Activity feeds

## 🗄️ Database Schema

The application uses Supabase PostgreSQL with the following main tables:
- `partners` - Partner company information
- `users` - User accounts (partners and sub-accounts)
- `leads` - Lead information and tracking
- `lead_status_history` - Audit trail for lead status changes

## 🔒 Security Features

- JWT authentication with refresh tokens
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Environment-based configuration

## 📱 Frontend Features

- Responsive design with Tailwind CSS
- State management with Zustand
- Form handling with React Hook Form
- Real-time updates with Socket.IO
- Type-safe development with TypeScript

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build:backend`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment  
1. Build the application: `npm run build:frontend`
2. Deploy to Vercel, Netlify, or your preferred platform

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Development Guide](./docs/development.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Status**: 🚧 Development in Progress

Current Phase: Task 1 - Project Infrastructure Setup ✅ 