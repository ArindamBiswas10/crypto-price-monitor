# Crypto Price Monitor

A real-time cryptocurrency price monitoring application with user authentication, customizable price alerts, and live updates via WebSocket connections. Deployed soon.

## Features

### User Authentication
- User registration and login
- Email verification system
- Password reset functionality
- JWT-based session management
- Secure cookie handling

### Real-time Price Monitoring
- Live cryptocurrency prices from CoinGecko API
- Real-time updates via Socket.IO
- Support for major cryptocurrencies (Bitcoin, Ethereum, etc.)
- Historical price data storage
- Market cap and volume information

### Price Alerts
- Create custom price alerts
- Multiple alert conditions:
  - Price goes above/below threshold
  - Percentage increase/decrease alerts
- Email notifications for triggered alerts
- Alert management (activate/deactivate/delete)
- User-specific alert statistics

### Modern UI/UX
- Responsive design for all devices
- Clean, modern interface
- Real-time connection status indicator
- Interactive price cards with gradient designs
- Toast notifications for user feedback

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **Redis** for caching
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email services
- **Winston** for logging
- **Joi** for validation
- **Node-cron** for scheduled tasks

### Frontend
- **React** with **TypeScript**
- **Socket.IO Client** for real-time updates
- **Modern CSS** with gradients and animations
- **Responsive Grid Layouts**
- **Toast Notifications**

### Database
- **MongoDB** for data storage
- **Redis** for caching and session storage

## Prerequisites

- **Node.js** 18+ 
- **MongoDB** (local or cloud instance)
- **Redis** (local or cloud instance)
- **SendGrid account** (for email functionality)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ArindamBiswas10/crypto-price-monitor.git
cd crypto-price-monitor
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/crypto-monitor
REDIS_URI=redis://localhost:6379

# API Keys
COINGECKO_API_KEY=your_coingecko_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URLs (for CORS and email links)
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-secure
JWT_EXPIRES_IN=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM_NAME=Crypto Monitor
EMAIL_FROM=your-verified-sender@yourdomain.com

# Update Intervals
PRICE_UPDATE_INTERVAL=10000
CACHE_DEFAULT_TTL=60000

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=100
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
```

### 4. Database Setup

**MongoDB:**
- Install MongoDB locally or use MongoDB Atlas
- Ensure MongoDB is running on the configured port

**Redis:**
- Install Redis locally or use a cloud service
- Ensure Redis is running on the configured port

### 5. Email Configuration (SendGrid)

1. Create a SendGrid account at https://sendgrid.com
2. Verify your sender identity (email address or domain)
3. Create an API key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Restricted Access" and enable "Mail Send" permissions
   - Copy the generated API key
4. Use the API key as `EMAIL_PASSWORD` in your `.env` file
5. Set `EMAIL_USERNAME` to `apikey` (literal string)
6. Use your verified sender email as `EMAIL_FROM`

### 6. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

### 7. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Price Endpoints
- `GET /api/prices` - Get current prices
- `GET /api/prices/:symbol` - Get specific coin price
- `GET /api/prices/:symbol/history` - Get price history
- `GET /api/prices/search?q=query` - Search cryptocurrencies
- `GET /api/prices/supported` - Get supported coins

### Alert Endpoints
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert
- `GET /api/alerts/stats` - Get alert statistics

### WebSocket Events
- `price-update` - Real-time price updates
- `alert-triggered` - Alert notifications
- `connection-status` - Connection status updates

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment | No | `development` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `REDIS_URI` | Redis connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration | No | `30d` |
| `COINGECKO_API_KEY` | CoinGecko API key | No | - |
| `EMAIL_USERNAME` | Email username | Yes | - |
| `EMAIL_PASSWORD` | Email password/app password | Yes | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:3000` |
| `CLIENT_URL` | Client URL for email links | No | `http://localhost:3000` |

## Features in Detail

### Price Monitoring
- Fetches data from CoinGecko API every 10 seconds
- Caches responses for performance optimization
- Broadcasts updates via WebSocket to all connected clients
- Stores historical data for trend analysis
- Supports 10+ major cryptocurrencies

### Alert System
- **Price Threshold Alerts:** Trigger when price goes above or below a set value
- **Percentage Change Alerts:** Trigger on percentage increase or decrease
- **Email Notifications:** Automatic email alerts when conditions are met
- **Real-time Notifications:** Instant browser notifications via WebSocket
- **Alert Management:** Users can activate, deactivate, or delete alerts
- **Auto-deactivation:** Alerts automatically deactivate after triggering to prevent spam

### User Management
- **Secure Registration:** Password hashing with bcrypt (12 rounds)
- **Email Verification:** Required email verification for account activation
- **Password Reset:** Secure token-based password reset system
- **Session Management:** JWT-based authentication with secure cookies
- **User Preferences:** Customizable notification and theme settings

## Troubleshooting

### Common Issues

**Real-time Updates Not Working**
```bash
# Check WebSocket connection in browser console
# Verify backend is running: curl http://localhost:3001/health
# Check for CORS errors in browser console
```

**Email Verification Not Working**
```bash
# Check backend logs for email errors
# Verify SendGrid API key is correct
# Check spam folder for verification emails
# Ensure sender email is verified in SendGrid
```

**Database Connection Issues**
```bash
# Ensure MongoDB is running: mongosh
# Check Redis: redis-cli ping
# Verify connection strings in .env
```

**API Errors**
```bash
# Check CoinGecko API status
# Verify API key if using premium tier
# Check rate limiting in logs
```

### Debug Information

The application includes debug information in the dashboard:
- WebSocket connection status
- Number of loaded cryptocurrencies
- Socket ID and connection details
- Last update timestamp

### Logging

Backend uses Winston for comprehensive logging:
- Error logs: `backend/logs/error.log`
- Combined logs: `backend/logs/combined.log`
- Console output in development mode

## Development

### Adding New Cryptocurrencies

Update the `supportedCoins` array in `backend/src/utils/config.ts`:

```typescript
supportedCoins: [
  'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana',
  'polkadot', 'dogecoin', 'avalanche-2', 'polygon', 'chainlink',
  'your-new-coin-id' // Add new coin ID here
]
```

### Extending Alert Types

1. Update the Alert interface in `backend/src/types/index.ts`
2. Add validation in `backend/src/middleware/validation.ts`
3. Implement logic in `backend/src/services/alertService.ts`
4. Update frontend Alert interface and UI components

### Custom Email Templates

Modify email templates in `backend/src/services/emailService.ts`:
- `sendVerificationEmail()`
- `sendPasswordResetEmail()`
- `sendAlertEmail()`

## Security Features

- **Password Security:** bcrypt hashing with 12 salt rounds
- **JWT Authentication:** Secure token-based authentication
- **Rate Limiting:** API endpoint protection against abuse
- **CORS Protection:** Configured for specific frontend origins
- **Input Validation:** Joi-based request validation
- **Security Headers:** Helmet.js security middleware
- **XSS Protection:** Input sanitization and validation
- **MongoDB Injection Protection:** Mongoose schema validation

## Performance Optimizations

- **Redis Caching:** Aggressive caching of API responses
- **WebSocket Efficiency:** Targeted broadcasting to subscribed clients
- **Database Indexing:** Optimized queries with proper indexes
- **Rate Limiting:** CoinGecko API rate limit compliance
- **Compression:** Gzip compression for responses
- **Connection Pooling:** Efficient database connection management

## Monitoring & Health Checks

### Health Check Endpoint
```bash
curl http://localhost:3001/health
```

Response includes:
- Server status and uptime
- Database connection status
- Email service configuration status
- Environment information

### Socket.IO Statistics
```bash
curl http://localhost:3001/api/socket/stats
```

Response includes:
- Connected clients count
- Subscription statistics
- Connection timestamps

## Screenshots

### Authentication
<img width="2559" height="1390" alt="image" src="https://github.com/user-attachments/assets/f8f47e7f-54d1-4fe5-b246-e653cfc29b2a" />

*User login interface with clean, modern design*

<img width="2559" height="1388" alt="image" src="https://github.com/user-attachments/assets/28ba87ee-d182-4b66-95c8-bdbdad68df4d" />

*Account creation form with validation*

### Dashboard
<img width="2559" height="1385" alt="image" src="https://github.com/user-attachments/assets/35a9bb1c-0915-4935-81c0-87421c8c3de5" />

*Main dashboard with real-time cryptocurrency prices and statistics*

<img width="1724" height="1027" alt="image" src="https://github.com/user-attachments/assets/98b01946-1635-4375-b967-ed61f0ec5648" />

*Interactive cryptocurrency price cards with live updates*


### Alerts Management
<img width="2556" height="1381" alt="image" src="https://github.com/user-attachments/assets/849ad548-77f1-4c25-afed-f2e79d1d645e" />

*Price alerts management interface*

<img width="2557" height="1382" alt="image" src="https://github.com/user-attachments/assets/850491a4-ba43-4225-9a89-dceb938ba846" />

*Alert creation modal with various condition options*

<img width="504" height="76" alt="image" src="https://github.com/user-attachments/assets/be6c3c86-0fea-4d03-8904-8138d9075e9b" />

*Real-time alert notifications in browser*

### User Profile
<img width="2557" height="1387" alt="image" src="https://github.com/user-attachments/assets/47c2c669-ba76-4904-a49b-caeb81b6082d" />

*User profile and settings page*

### Email Notifications
<img width="2089" height="714" alt="image" src="https://github.com/user-attachments/assets/d23b3d59-e752-4c36-9734-72b229d9d02b" />

*Email verification message template*

<img width="2096" height="804" alt="image" src="https://github.com/user-attachments/assets/1376f395-a2dd-43d0-adfc-78996d0d6b1d" />

*Price alert notification email template*



## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Ask to contribute and when accepted
6. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Write meaningful commit messages
- Update documentation for new features
- Test thoroughly before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review backend logs for error details
- Open an issue on the repository
- Check browser console for frontend errors

---

**Built with modern web technologies for reliable cryptocurrency monitoring**
