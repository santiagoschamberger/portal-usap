import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import { rateLimit } from 'express-rate-limit';
const cookieParser = require('cookie-parser');
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { supabase } from './config/database';
import { zohoService } from './services/zohoService';
import { cronService } from './services/cronService';

// Import routes
import authRoutes from './routes/auth-simple';
import leadsRoutes from './routes/leads';
import dealsRoutes from './routes/deals';
import webhooksRoutes from './routes/webhooks';
import partnersRoutes from './routes/partners';
import syncRoutes from './routes/sync';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Rate limiting - disabled for testing
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: { error: 'Too many requests from this IP, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use('/api', limiter); // disabled for testing

// Validate Zoho configuration on startup
try {
    zohoService.validateConfig();
    console.log('✅ Zoho CRM configuration validated');
} catch (error) {
    console.error('❌ Zoho CRM configuration error:', error instanceof Error ? error.message : error);
}

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'USA Payments Partner Portal API',
        version: '1.0.0',
        status: 'running',
        environment: NODE_ENV,
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            leads: '/api/leads',
            deals: '/api/deals',
            partners: '/api/partners',
            webhooks: '/api/webhooks',
            sync: '/api/sync'
        },
        documentation: 'See README.md for API documentation'
    });
});

// Health check endpoint with database and Zoho connectivity
app.get('/health', async (req, res) => {
    let databaseStatus = 'disconnected';
    let zohoStatus = 'disconnected';

    // Test database connection
    try {
        const { data, error } = await supabase.from('health_check').select('id').limit(1);
        if (!error && data.length > 0) {
            databaseStatus = 'connected';
        }
    } catch (error) {
        console.error('Database health check failed:', error);
    }

    // Test Zoho connection
    try {
        await zohoService.getAccessToken();
        zohoStatus = 'connected';
    } catch (error) {
        console.error('Zoho health check failed:', error);
    }

    const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0',
        services: {
            api: 'running',
            socketio: 'running',
            database: databaseStatus,
            zoho_crm: zohoStatus
        }
    };

    res.status(200).json(healthData);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/sync', syncRoutes);

// API routes catch-all (place after specific routes)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: 'The requested API endpoint does not exist'
  });
});

// Socket.IO connection handling
io.on('connection', (socket: any) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔌 Webhook endpoint: http://localhost:${PORT}/api/webhooks`);
  
  // Initialize cron jobs for daily sync
  if (NODE_ENV === 'production') {
    cronService.init();
    console.log(`⏰ Daily sync scheduled for 2:00 AM UTC`);
  } else {
    console.log(`⏰ Cron jobs disabled in ${NODE_ENV} mode`);
  }
});

export { app, io }; 