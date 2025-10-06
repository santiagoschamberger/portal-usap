# Documentation Index

Welcome to the USA Payments Partner Portal documentation. This directory contains all technical documentation organized by purpose.

## 📖 Quick Navigation

### Getting Started
- **New to the project?** Start with [Quick Start](./setup/QUICK_START.md)
- **Complete setup?** See [Complete Setup Guide](./setup/COMPLETE_SETUP_GUIDE.md)
- **Main README** [Project Overview](../README.md)

### Setup & Integration
Located in [`setup/`](./setup/)
- [Complete Setup Guide](./setup/COMPLETE_SETUP_GUIDE.md) - Comprehensive setup instructions
- [Quick Start](./setup/QUICK_START.md) - Get running fast
- [Zoho Integration Setup](./setup/ZOHO_INTEGRATION_SETUP.md) - Configure Zoho webhooks
- [Zoho Integration Guide](./setup/zoho-integration-guide.md) - Detailed Zoho CRM integration
- [Frontend Documentation](./setup/frontend-doc.md) - Frontend architecture details

### Deployment
Located in [`deployment/`](./deployment/)
- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md) - General deployment instructions
- [Railway Backend Deployment](./deployment/RAILWAY_BACKEND_DEPLOY.md) - Deploy backend to Railway
- [Vercel Frontend Deployment](./deployment/VERCEL_DEPLOYMENT.md) - Deploy frontend to Vercel

### Testing
Located in [`testing/`](./testing/)
- [Testing Zoho Sync](./testing/TESTING_ZOHO_SYNC.md) - Test integration flows
- [Test Results](./testing/TEST_RESULTS.md) - Latest test results
- [Manual Testing Guide](./testing/MANUAL_TESTING_GUIDE.md) - Manual testing procedures
- [Zoho Testing Guide](./testing/ZOHO_TESTING_GUIDE.md) - Zoho-specific tests

### Historical Reference
Located in [`archive/`](./archive/)

Contains historical notes and completion documents from development:
- Database setup completion
- Frontend error fixes
- Layout completion notes
- Deployment fixes
- And more...

## 🗂️ Directory Structure

```
docs/
├── README.md                     # This file
├── prd.txt                       # Original Product Requirements Document
│
├── setup/                        # Setup & Integration Guides
│   ├── COMPLETE_SETUP_GUIDE.md
│   ├── QUICK_START.md
│   ├── ZOHO_INTEGRATION_SETUP.md
│   ├── ZOHO_INTEGRATION_COMPLETE.md
│   ├── zoho-integration-guide.md
│   └── frontend-doc.md
│
├── deployment/                   # Deployment Guides
│   ├── DEPLOYMENT_GUIDE.md
│   ├── RAILWAY_BACKEND_DEPLOY.md
│   └── VERCEL_DEPLOYMENT.md
│
├── testing/                      # Testing Documentation
│   ├── TESTING_ZOHO_SYNC.md
│   ├── TEST_RESULTS.md
│   ├── MANUAL_TESTING_GUIDE.md
│   └── ZOHO_TESTING_GUIDE.md
│
└── archive/                      # Historical Documents
    ├── DATABASE_SETUP_COMPLETE.md
    ├── FRONTEND_ERRORS_FIXED.md
    ├── LAYOUT_COMPLETE.md
    ├── RAILWAY_FRONTEND_FIX.md
    ├── RAILWAY_QUICK_FIX.md
    ├── VERCEL_FIX.md
    ├── TEST_ZOHO_PRODUCTION.md
    └── CLAUDE.md
```

## 📋 Documentation by Role

### For Developers
1. [Quick Start](./setup/QUICK_START.md) - Get development environment running
2. [Frontend Documentation](./setup/frontend-doc.md) - Understand frontend architecture
3. [Testing Guide](./testing/MANUAL_TESTING_GUIDE.md) - Test your changes

### For DevOps
1. [Railway Backend Deployment](./deployment/RAILWAY_BACKEND_DEPLOY.md) - Backend hosting
2. [Vercel Frontend Deployment](./deployment/VERCEL_DEPLOYMENT.md) - Frontend hosting
3. [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md) - General deployment info

### For Integration Engineers
1. [Zoho Integration Guide](./setup/zoho-integration-guide.md) - Detailed integration docs
2. [Zoho Integration Setup](./setup/ZOHO_INTEGRATION_SETUP.md) - Configure webhooks
3. [Testing Zoho Sync](./testing/TESTING_ZOHO_SYNC.md) - Test integration

### For QA/Testing
1. [Manual Testing Guide](./testing/MANUAL_TESTING_GUIDE.md) - Manual test procedures
2. [Testing Zoho Sync](./testing/TESTING_ZOHO_SYNC.md) - Integration testing
3. [Test Results](./testing/TEST_RESULTS.md) - Latest test results

## 🔍 Finding Information

### Looking for...
- **How to set up the project?** → [Quick Start](./setup/QUICK_START.md) or [Complete Setup](./setup/COMPLETE_SETUP_GUIDE.md)
- **How to deploy?** → [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)
- **How Zoho integration works?** → [Zoho Integration Guide](./setup/zoho-integration-guide.md)
- **How to test?** → [Testing Documentation](./testing/)
- **Project overview?** → [Main README](../README.md)
- **Architecture details?** → [Memory Bank](../memory-bank/)

## 🎯 Common Tasks

### Setting Up Development Environment
```bash
# 1. Clone repository
git clone <repository-url>
cd usapayments-portal-2.0

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment
# Follow: docs/setup/QUICK_START.md

# 4. Start development
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### Deploying to Production
```bash
# Backend (Railway)
git push railway main

# Frontend (Vercel)
# Auto-deploys on push to main

# See: docs/deployment/DEPLOYMENT_GUIDE.md
```

### Testing Integration
```bash
# Run test script
cd backend
node test-complete-flow.js

# See: docs/testing/TESTING_ZOHO_SYNC.md
```

## 📚 Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/v6/)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)

### Project Resources
- [Memory Bank](../memory-bank/) - AI agent memory and project context
- [Main README](../README.md) - Project overview and quick start
- [PRD](./prd.txt) - Original product requirements

## 🤝 Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate subdirectory
2. Update this index
3. Link from relevant documents
4. Use clear, descriptive names
5. Include date and author in document

### Documentation Standards
- Use Markdown format
- Include code examples where helpful
- Add visual diagrams when possible
- Keep setup steps clear and numbered
- Test all commands before documenting
- Update when features change

## 📞 Getting Help

If you can't find what you're looking for:
1. Check the [Main README](../README.md)
2. Review [Memory Bank](../memory-bank/) for context
3. Search through [archived docs](./archive/)
4. Create an issue in the repository
5. Contact the development team

---

**Last Updated**: October 6, 2025
**Maintained By**: Development Team

