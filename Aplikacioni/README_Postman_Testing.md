# 🧪 Udhëzues për Testimin e API me Postman

## 📋 Përgatitja

### 1. Startoni Backend-in
```bash
cd BackEnd
npm start
```

Duhet të shihni: `🚀 Elioti server running on localhost:3000`

### 2. Importoni Collection-in në Postman

1. Hapni Postman
2. Klikoni "Import"
3. Zgjidhni file-in `Postman_Collection.json`
4. Klikoni "Import"

### 3. Konfiguroni Environment

1. Klikoni "Environments" → "New"
2. Emërtoni: `Aplikacioni Local`
3. Shtoni variablat:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (zbrazët për tani)
4. Klikoni "Save"

## 🔐 Testimi i Authentication

### Hapi 1: Regjistrimi
1. Zgjidhni "Authentication" → "Register User"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 201 dhe ka `userId`

### Hapi 2: Kyçja
1. Zgjidhni "Authentication" → "Login User"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `token`
4. **Token-i ruhet automatikisht në environment**

### Hapi 3: Testimi i Gabimeve
1. Zgjidhni "Authentication" → "Login with Wrong Credentials"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 401

## 👤 Testimi i User Management

### Get User Profile
1. Zgjidhni "User Management" → "Get User Profile"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka të dhënat e përdoruesit

### Get User Balance
1. Zgjidhni "User Management" → "Get User Balance"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `balance`

### Get User Statistics
1. Zgjidhni "User Management" → "Get User Statistics"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `statistics`

## 💰 Testimi i Transactions

### Create Transaction
1. Zgjidhni "Transactions" → "Create Transaction"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 201 dhe ka `transaction.id`

### Get All Transactions
1. Zgjidhni "Transactions" → "Get All Transactions"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `transactions` array

### Get Transactions with Filters
1. Zgjidhni "Transactions" → "Get Transactions with Filters"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka transaksione të filtruara

### Get Transaction Summary
1. Zgjidhni "Transactions" → "Get Transaction Summary"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `summary`

### Update Transaction
1. Zgjidhni "Transactions" → "Update Transaction"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `transaction`

### Delete Transaction
1. Zgjidhni "Transactions" → "Delete Transaction"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `success: true`

## 🎯 Testimi i Goals

### Create Goal
1. Zgjidhni "Goals" → "Create Goal"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 201 dhe ka `goal.id`

### Get All Goals
1. Zgjidhni "Goals" → "Get All Goals"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `goals` array

### Update Goal Progress
1. Zgjidhni "Goals" → "Update Goal Progress"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `goal`

## ⚙️ Testimi i Profile Settings

### Get Profile Settings
1. Zgjidhni "Profile Settings" → "Get Profile Settings"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `settings`

### Update Profile Settings
1. Zgjidhni "Profile Settings" → "Update Profile Settings"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 200 dhe ka `settings`

## ❌ Testimi i Error Cases

### Access Without Token
1. Zgjidhni "Error Testing" → "Access Without Token"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 401 dhe ka mesazh gabimi

### Invalid Endpoint
1. Zgjidhni "Error Testing" → "Invalid Endpoint"
2. Klikoni "Send"
3. Kontrolloni që përgjigja është 404 dhe ka mesazh gabimi

## 🚀 Automatizimi i Testeve

### Run Collection
1. Klikoni në collection-in "Aplikacioni API Collection"
2. Klikoni "Run collection"
3. Zgjidhni environment-in "Aplikacioni Local"
4. Klikoni "Run Aplikacioni API Collection"

### Test Results
- ✅ Të gjitha testet duhet të kalojnë
- ❌ Nëse ndonjë test dështon, kontrolloni:
  - A është backend-i duke punuar?
  - A është token-i i vlefshëm?
  - A janë të dhënat në formatin e duhur?

## 📊 Përgjigjet e Pritura

### Authentication
```json
// Register Success
{
  "success": true,
  "message": "Registration successful",
  "userId": "generated-id",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Login Success
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "fullName": "Test User",
    "email": "test@example.com"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Transactions
```json
// Create Transaction Success
{
  "success": true,
  "transaction": {
    "id": "transaction-id",
    "amount": 150.50,
    "type": "expense",
    "category": "Ushqim",
    "description": "Pazar ushqimesh",
    "transactionDate": "2024-01-15"
  }
}

// Get Transactions Success
{
  "success": true,
  "transactions": [
    {
      "id": "transaction-id",
      "amount": 150.50,
      "type": "expense",
      "category": "Ushqim",
      "description": "Pazar ushqimesh",
      "transactionDate": "2024-01-15"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": 401,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Troubleshooting

### Problemi: "Connection refused"
**Zgjidhja:** Sigurohuni që backend-i të jetë duke punuar në portin 3000

### Problemi: "401 Unauthorized"
**Zgjidhja:** 
1. Bëni login përsëri për të marrë token të ri
2. Kontrolloni që token-i është ruajtur në environment

### Problemi: "404 Not Found"
**Zgjidhja:** Kontrolloni që URL-ja është e saktë dhe endpoint-i ekziston

### Problemi: "500 Internal Server Error"
**Zgjidhja:** 
1. Kontrolloni log-et e backend-it
2. Sigurohuni që database-i është konfiguruar saktë

## 📝 Shënime të Rëndësishme

1. **Token Management:** Token-i ruhet automatikisht pas login-it
2. **Environment Variables:** Përdorni environment-in "Aplikacioni Local"
3. **Test Scripts:** Çdo request ka test scripts të paracaktuar
4. **Error Handling:** Të gjitha error cases janë testuar
5. **Data Validation:** Kontrolloni që të dhënat në body janë në formatin e duhur

## 🎯 Hapat e Testimit

1. **Startoni backend-in**
2. **Importoni collection-in**
3. **Konfiguroni environment-in**
4. **Bëni register**
5. **Bëni login**
6. **Testoni të gjitha endpoints**
7. **Kontrolloni error cases**
8. **Run collection automatikisht**

Kjo do t'ju japë një pamje të plotë të funksionalitetit të backend-it tuaj! 🚀
