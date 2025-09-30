"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookieParser = require('cookie-parser');
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const zohoService_1 = require("./services/zohoService");
const auth_simple_1 = __importDefault(require("./routes/auth-simple"));
const leads_1 = __importDefault(require("./routes/leads"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieParser());
try {
    zohoService_1.zohoService.validateConfig();
    console.log('✅ Zoho CRM configuration validated');
}
catch (error) {
    console.error('❌ Zoho CRM configuration error:', error instanceof Error ? error.message : error);
}
app.get('/health', async (req, res) => {
    let databaseStatus = 'disconnected';
    let zohoStatus = 'disconnected';
    try {
        const { data, error } = await database_1.supabase.from('health_check').select('id').limit(1);
        if (!error && data.length > 0) {
            databaseStatus = 'connected';
        }
    }
    catch (error) {
        console.error('Database health check failed:', error);
    }
    try {
        await zohoService_1.zohoService.getAccessToken();
        zohoStatus = 'connected';
    }
    catch (error) {
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
app.use('/api/auth', auth_simple_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/webhooks', webhooks_1.default);
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        message: 'The requested API endpoint does not exist'
    });
});
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        error: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        ...(NODE_ENV !== 'production' && { stack: err.stack })
    });
});
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🔌 Webhook endpoint: http://localhost:${PORT}/api/webhooks`);
});
//# sourceMappingURL=index.js.map