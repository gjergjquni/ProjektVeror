# Multi-Step Registration Flow

## Overview
The registration process has been enhanced with a 4-step flow that includes email verification and enhanced security features.

## Registration Steps

### Step 1: Basic Information
**Endpoint:** `POST /register/step1`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "day": 15,
  "month": 6,
  "year": 1990
}
```

**Response:**
```json
{
  "success": true,
  "registrationId": "reg_abc123...",
  "message": "Step 1 completed successfully"
}
```

### Step 2: Employment Status
**Endpoint:** `POST /register/step2`

**Request Body:**
```json
{
  "registrationId": "reg_abc123...",
  "employmentStatus": "i punësuar",
  "jobTitle": "Software Developer",
  "monthlySalary": 2500
}
```

**Employment Status Options:**
- `i punësuar` (employed)
- `i papunë` (unemployed)
- `student` (student)
- `pensioner` (retired)
- `biznesmen` (businessman)

### Step 3: Account Details
**Endpoint:** `POST /register/step3`

**Request Body:**
```json
{
  "registrationId": "reg_abc123...",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)
- Cannot contain sequential identical characters
- Cannot be common weak passwords

### Step 4: Email Verification
**Endpoint:** `POST /register/verify`

**Request Body:**
```json
{
  "registrationId": "reg_abc123...",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Regjistrimi u krye me sukses!",
  "userId": "user_123...",
  "sessionId": "session_abc...",
  "user": {
    "fullName": "John Doe",
    "email": "user@example.com",
    "employmentStatus": "i punësuar"
  }
}
```

## Security Features

### Rate Limiting
- **Registration:** 3 attempts per 10 minutes
- **Login:** 5 attempts per 5 minutes
- **Transactions:** 50 per minute

### Enhanced Validation
- Email validation with disposable domain check
- Strong password requirements
- Input sanitization
- Date of birth validation
- Employment status validation

### Email Verification
- 6-digit verification code
- 10-minute expiration
- Secure code generation using crypto.randomInt()

### Audit Logging
- All registration steps are logged
- Timestamp tracking
- Session management

## Environment Variables

Create a `.env` file with:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
JWT_SECRET=your-super-secret-jwt-key
```

## Usage Example

```javascript
// Step 1: Basic Info
const step1Response = await fetch('/register/step1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    day: 15,
    month: 6,
    year: 1990
  })
});

const { registrationId } = await step1Response.json();

// Step 2: Employment
await fetch('/register/step2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    registrationId,
    employmentStatus: 'i punësuar',
    jobTitle: 'Developer',
    monthlySalary: 2500
  })
});

// Step 3: Account Details
await fetch('/register/step3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    registrationId,
    email: 'user@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  })
});

// Step 4: Verify Email
const finalResponse = await fetch('/register/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    registrationId,
    verificationCode: '123456' // Code from email
  })
});
``` 