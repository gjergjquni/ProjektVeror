# Elioti Financial Platform - Backend

A secure, modular Node.js backend for the Elioti financial management platform. Built with native Node.js modules, JWT authentication, SQLCipher encryption, and comprehensive security measures.

## 🚀 Features

- **🔐 Secure Authentication**: JWT-based authentication with token refresh and blacklisting
- **🛡️ Enhanced Security**: Rate limiting, input validation, SQL injection prevention
- **💾 Encrypted Database**: SQLCipher integration for data encryption at rest
- **📊 Financial Management**: Complete transaction tracking and reporting
- **👤 User Profiles**: Comprehensive user profile and settings management
- **📝 Audit Logging**: Complete audit trail for all user actions
- **⚡ Performance**: Native Node.js modules for optimal performance
- **🔧 Modular Architecture**: Clean, maintainable code structure

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd elioti-backend
npm install
```

### 2. Run Setup Script

```bash
npm run setup
```

This will:
- Generate secure JWT and database encryption keys
- Create necessary directories (logs, data)
- Set up environment variables
- Configure the application

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured port).

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Security
JWT_SECRET=your-secure-jwt-secret
DB_ENCRYPTION_KEY=your-database-encryption-key

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Security Configuration

The application includes several security features:

- **Rate Limiting**: Prevents abuse with configurable limits per endpoint
- **Input Validation**: Comprehensive validation and sanitization
- **JWT Tokens**: Secure token-based authentication with expiration
- **Password Hashing**: bcrypt with configurable rounds
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configurable cross-origin resource sharing

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "day": 15,
  "month": 6,
  "year": 1990,
  "employmentStatus": "i punësuar"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <jwt-token>
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <jwt-token>
```

### User Endpoints

#### Get User Profile
```http
GET /user/profile
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```http
PUT /user/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "jobTitle": "Software Developer",
  "monthlySalary": 2500,
  "savingsGoalPercentage": 20
}
```

#### Get User Balance
```http
GET /user/balance
Authorization: Bearer <jwt-token>
```

#### Get User Statistics
```http
GET /user/stats
Authorization: Bearer <jwt-token>
```

### Transaction Endpoints

#### Create Transaction
```http
POST /transaction
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 150.50,
  "type": "expense",
  "category": "Ushqim",
  "description": "Grocery shopping",
  "transactionDate": "2024-01-15"
}
```

#### Get Transactions
```http
GET /transaction?page=1&limit=20&type=expense&category=Ushqim
Authorization: Bearer <jwt-token>
```

#### Get Transaction Summary
```http
GET /transaction/summary?startDate=2024-01-01&endDate=2024-01-31&groupBy=category
Authorization: Bearer <jwt-token>
```

#### Update Transaction
```http
PUT /transaction/<transaction-id>
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 160.00,
  "description": "Updated grocery shopping"
}
```

#### Delete Transaction
```http
DELETE /transaction/<transaction-id>
Authorization: Bearer <jwt-token>
```

### Profile Endpoints

#### Get Profile Settings
```http
GET /profile/settings
Authorization: Bearer <jwt-token>
```

#### Update Profile Settings
```http
PUT /profile/settings
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "notifications": {
    "email": true,
    "push": false
  },
  "privacy": {
    "shareData": false,
    "publicProfile": false
  }
}
```

## 🧪 Testing the API

### Using curl

#### 1. Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User",
    "day": 15,
    "month": 6,
    "year": 1990,
    "employmentStatus": "i punësuar"
  }'
```

#### 2. Login and get token
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Use the token for authenticated requests
```bash
# Get user profile
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a transaction
curl -X POST http://localhost:3000/transaction \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "type": "expense",
    "category": "Ushqim",
    "description": "Grocery shopping"
  }'
```

### Using Postman

1. Import the following collection:
```json
{
  "info": {
    "name": "Elioti API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{baseUrl}}/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"SecurePass123!\",\n  \"fullName\": \"Test User\",\n  \"day\": 15,\n  \"month\": 6,\n  \"year\": 1990,\n  \"employmentStatus\": \"i punësuar\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

2. Set up environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (will be set after login)

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)
- No common weak passwords
- No more than 2 consecutive identical characters

### Rate Limiting
- General API: 100 requests per minute
- Login: 5 attempts per 5 minutes
- Registration: 3 attempts per 10 minutes
- Financial endpoints: 50 requests per minute

### JWT Token Security
- Secure token generation with HMAC-SHA256
- Configurable expiration (default: 24 hours)
- Token blacklisting for logout
- Automatic token refresh capability

## 📁 Project Structure

```
elioti-backend/
├── server.js              # Main server file
├── setup.js               # Setup script
├── config.js              # Configuration
├── package.json           # Dependencies
├── .env                   # Environment variables
├── routes/                # Route handlers
│   ├── authRoutes.js      # Authentication routes
│   ├── userRoutes.js      # User management routes
│   ├── transactionRoutes.js # Transaction routes
│   └── profileRoutes.js   # Profile routes
├── data/                  # Database files
├── logs/                  # Application logs
├── authMiddleware.js      # Authentication middleware
├── sessionManager.js      # JWT session management
├── databaseManager.js     # Database operations
├── rateLimiter.js         # Rate limiting
├── validators.js          # Input validation
└── errorHandler.js        # Error handling
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use proper secrets management
2. **Database**: Use production-grade database (PostgreSQL, MySQL)
3. **SSL/TLS**: Enable HTTPS in production
4. **Logging**: Configure proper logging and monitoring
5. **Backup**: Implement regular database backups
6. **Monitoring**: Set up application monitoring and alerting

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Elioti Financial Platform** - Secure, modern financial management for Albania 🇦🇱 