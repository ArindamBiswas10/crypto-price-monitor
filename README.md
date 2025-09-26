## Crypto Price Monitor
A real-time cryptocurrency price monitoring application with user authentication, customizable price alerts, and live updates via WebSocket connections.
## Features

## User Authentication

User registration and login
Email verification system
Password reset functionality
JWT-based session management
Secure cookie handling

Real-time Price Monitoring

Live cryptocurrency prices from CoinGecko API
Real-time updates via Socket.IO
Support for major cryptocurrencies (Bitcoin, Ethereum, etc.)
Historical price data and charts
Market cap and volume information

Price Alerts

Create custom price alerts
Multiple alert conditions:

Price goes above/below threshold
Percentage increase/decrease alerts


Email notifications for triggered alerts
Alert management (activate/deactivate/delete)
User-specific alert statistics

Modern UI/UX

Responsive design for all devices
Clean, modern interface
Real-time connection status indicator
Interactive price cards with gradient designs
Toast notifications for user feedback

Tech Stack
Backend

Node.js with Express.js
TypeScript for type safety
MongoDB with Mongoose ODM
Redis for caching
Socket.IO for real-time communication
JWT for authentication
bcryptjs for password hashing
Nodemailer for email services
Winston for logging
Joi for validation
Node-cron for scheduled tasks

Frontend

React with TypeScript
Socket.IO Client for real-time updates
Modern CSS with gradients and animations
Responsive Grid Layouts
Toast Notifications

Infrastructure

Docker & Docker Compose
MongoDB database
Redis cache
Nginx (configurable)

Project Structure
crypto-monitor/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── logs/                # Application logs
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── styles/          # CSS files
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
Quick Start
Prerequisites

Docker and Docker Compose
Node.js 18+ (for local development)
MongoDB (if running locally)
Redis (if running locally)

Using Docker (Recommended)

Clone the repository

bash   git clone <repository-url>
   cd crypto-monitor

Set up environment variables

bash   cp .env.example .env
Edit .env with your configuration:
env   # Required
   COINGECKO_API_KEY=your_coingecko_api_key
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   
   # Optional (defaults provided)
   MONGODB_URI=mongodb://mongodb:27017/crypto-monitor
   REDIS_URI=redis://redis:6379
   PORT=3001
   NODE_ENV=production

Start the application

bash   # Production mode
   docker-compose up -d
   
   # Development mode (with hot reload)
   docker-compose -f docker-compose.dev.yml up

Access the application

Frontend: http://localhost:3000
Backend API: http://localhost:3001
Health Check: http://localhost:3001/health



Local Development

Start the databases

bash   docker-compose -f docker-compose.dev.yml up mongodb redis -d

Backend setup

bash   cd backend
   npm install
   npm run dev

Frontend setup

bash   cd frontend
   npm install
   npm start
API Documentation
Authentication Endpoints

POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET /api/auth/me - Get current user
POST /api/auth/logout - Logout user
POST /api/auth/forgot-password - Request password reset
PUT /api/auth/reset-password/:token - Reset password
GET /api/auth/verify-email/:token - Verify email

Price Endpoints

GET /api/prices - Get current prices
GET /api/prices/:symbol - Get specific coin price
GET /api/prices/:symbol/history - Get price history
GET /api/prices/search?q=query - Search cryptocurrencies

Alert Endpoints

GET /api/alerts - Get user's alerts
POST /api/alerts - Create new alert
PUT /api/alerts/:id - Update alert
DELETE /api/alerts/:id - Delete alert
GET /api/alerts/stats - Get alert statistics

WebSocket Events

price-update - Real-time price updates
alert-triggered - Alert notifications
connection-status - Connection status updates

Configuration
Environment Variables
VariableDescriptionDefaultPORTServer port3001NODE_ENVEnvironmentdevelopmentMONGODB_URIMongoDB connectionmongodb://localhost:27017/crypto-monitorREDIS_URIRedis connectionredis://localhost:6379JWT_SECRETJWT signing secretRequiredJWT_EXPIRES_INJWT expiration30dCOINGECKO_API_KEYCoinGecko API keyOptionalEMAIL_HOSTSMTP hostsmtp.gmail.comEMAIL_USERNAMEEmail usernameRequiredEMAIL_PASSWORDEmail passwordRequiredFRONTEND_URLFrontend URL for CORShttp://localhost:3000
Email Setup
Use Sendrid

Features in Detail
Price Monitoring

Fetches data from CoinGecko API every 10 seconds
Caches responses for performance
Broadcasts updates via WebSocket
Stores historical data for charts

Alert System

Four alert types:

Price above threshold
Price below threshold
Percentage increase
Percentage decrease


Email notifications
Real-time browser notifications
Automatic alert deactivation after trigger

User Management

Secure password hashing with bcrypt
Email verification workflow
Password reset functionality
User preferences and settings
Session management with JWT

Deployment
Production Deployment

Update environment variables for production
Use production Docker Compose:

bash   docker-compose -f docker-compose.yml up -d

Set up reverse proxy (recommended):

nginx   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
       }
       
       location /socket.io {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
Health Checks

Backend health endpoint: /health
Docker health checks included
Monitoring for database connections
Service status indicators

Monitoring & Logging

Winston logging with file and console outputs
Error tracking and request logging
Performance monitoring for API calls
Connection status monitoring for WebSocket
Alert statistics and user analytics

Security Features

Password hashing with bcrypt (12 rounds)
JWT token authentication
Rate limiting on API endpoints
CORS protection
Helmet.js security headers
Input validation with Joi
SQL injection protection via Mongoose
XSS protection via sanitization

Contributing

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing-feature)
Open a Pull Request

Development Guidelines

Follow TypeScript best practices
Write tests for new features
Update documentation
Follow existing code style
Add proper error handling

Troubleshooting
Common Issues
MongoDB Connection Failed
bash# Check if MongoDB is running
docker-compose ps
# Restart MongoDB
docker-compose restart mongodb
Redis Connection Issues
bash# Check Redis status
docker-compose exec redis redis-cli ping
Email Not Sending

Verify Gmail App Password
Check firewall/network restrictions
Validate email configuration

WebSocket Connection Failed

Check CORS configuration
Verify frontend URL in backend config
Check for proxy/firewall issues

Logs
bash# View application logs
docker-compose logs backend
docker-compose logs frontend


### Screenshots

