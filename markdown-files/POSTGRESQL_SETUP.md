# PostgreSQL Setup Guide

## 🎯 **Complete PostgreSQL Implementation**

This guide will help you set up a self-hosted PostgreSQL database to replace Supabase in your SaaS application.

---

## 📋 **What We've Implemented**

### ✅ **Docker Configuration**

- **PostgreSQL 15** with Alpine Linux
- **Redis** for session management
- **Health checks** and automatic restarts
- **Volume persistence** for data storage

### ✅ **Database Schema**

- **Users table** with authentication fields
- **User sessions** for session management
- **User profiles** for extended user data
- **Posts table** as an example content model
- **Indexes** for performance optimization
- **Triggers** for automatic timestamp updates

### ✅ **Authentication System**

- **Custom auth** with JWT tokens
- **Password hashing** with bcrypt
- **Session management** with Redis
- **Email validation** and password strength requirements
- **API routes** for login, register, and logout

### ✅ **Database Utilities**

- **Connection pooling** for performance
- **Helper functions** for common operations
- **Type-safe** database operations
- **Error handling** and logging

---

## 🚀 **Quick Setup**

### **Step 1: Run Setup Script**

```bash
# Make script executable
chmod +x scripts/setup-postgres.sh

# Run the setup script
npm run setup:postgres
```

This will:

- Create necessary directories
- Generate secure passwords
- Start PostgreSQL and Redis containers
- Set up the database schema

### **Step 2: Configure Environment**

Edit your `.env` file:

```bash
# Database Configuration
DB_NAME=sveltekit_app
DB_USER=app_user
DB_PASSWORD=your_generated_password
DB_HOST=localhost
DB_PORT=5432

# Full Database URL
DATABASE_URL=postgresql://app_user:your_generated_password@localhost:5432/sveltekit_app

# Redis Configuration
REDIS_PASSWORD=your_generated_redis_password
REDIS_URL=redis://:your_generated_redis_password@localhost:6379

# App Configuration
JWT_SECRET=your_generated_jwt_secret
APP_URL=http://localhost:5173
NODE_ENV=development

# Email Configuration (for auth)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Step 3: Test the Setup**

```bash
# Start your development server
npm run dev

# Run PostgreSQL tests
npm run test:postgres
```

---

## 🧪 **Test User**

A test user is automatically created:

- **Email:** `test@example.com`
- **Password:** `password123`

You can use these credentials to test the authentication system.

---

## 📊 **API Endpoints**

### **Authentication Endpoints**

#### **POST /api/auth/login**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### **POST /api/auth/register**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### **POST /api/auth/logout**

No body required - clears session cookie.

---

## 🔧 **Database Operations**

### **User Management**

```typescript
import { db } from '$lib/server/database.js';

// Get user by email
const user = await db.getUser('test@example.com');

// Create new user
const newUser = await db.createUser({
  email: 'user@example.com',
  passwordHash: 'hashed_password',
  firstName: 'John',
  lastName: 'Doe',
});

// Update last login
await db.updateLastLogin(userId);
```

### **Session Management**

```typescript
import { db } from '$lib/server/database.js';

// Create session
await db.createSession(userId, sessionToken, expiresAt, ipAddress, userAgent);

// Get session
const session = await db.getSession(sessionToken);

// Delete session
await db.deleteSession(sessionToken);

// Clean expired sessions
await db.cleanExpiredSessions();
```

### **User Profiles**

```typescript
import { db } from '$lib/server/database.js';

// Get user profile
const profile = await db.getUserProfile(userId);

// Create user profile
const newProfile = await db.createUserProfile(userId, {
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Software developer',
  website: 'https://example.com',
  location: 'New York',
  timezone: 'America/New_York',
  preferences: { theme: 'dark' },
});

// Update user profile
const updatedProfile = await db.updateUserProfile(userId, {
  bio: 'Updated bio',
  preferences: { theme: 'light' },
});
```

---

## 🐳 **Docker Commands**

### **Start Services**

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose-postgres.yml up -d

# View logs
docker-compose -f docker-compose-postgres.yml logs -f postgres
docker-compose -f docker-compose-postgres.yml logs -f redis
```

### **Database Access**

```bash
# Connect to PostgreSQL
docker exec -it sveltekit_postgres psql -U app_user -d sveltekit_app

# View tables
\dt

# View users
SELECT * FROM users;
```

### **Backup and Restore**

```bash
# Create backup
npm run backup:db

# Restore from backup
docker exec -i sveltekit_postgres psql -U app_user -d postgres < backups/backup_20241220_143022.sql.gz
```

---

## 🔒 **Security Features**

### **Password Security**

- **bcrypt hashing** with 12 rounds
- **Password strength validation**
- **Secure session tokens**

### **Session Security**

- **HTTP-only cookies**
- **Secure flag in production**
- **SameSite strict**
- **Automatic session cleanup**

### **Database Security**

- **Connection pooling**
- **SQL injection prevention**
- **Parameterized queries**
- **Index optimization**

---

## 📈 **Performance Optimization**

### **Database Indexes**

- Email lookup optimization
- Session token indexing
- User ID foreign key indexes
- Published content filtering

### **Connection Pooling**

- Maximum 10 connections
- 20-second idle timeout
- 10-second connection timeout
- Automatic connection cleanup

### **Caching Strategy**

- Redis for session storage
- User profile caching
- Query result caching

---

## 🚀 **Production Deployment**

### **Environment Variables**

```bash
# Production settings
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://:pass@host:6379
JWT_SECRET=your_secure_jwt_secret
APP_URL=https://yourdomain.com
```

### **SSL Configuration**

```bash
# Enable SSL for production
ssl: true
```

### **Backup Strategy**

```bash
# Add to crontab for daily backups
0 2 * * * cd /path/to/app && npm run backup:db
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Database Connection Failed**

   ```bash
   # Check if containers are running
   docker-compose -f docker-compose-postgres.yml ps

   # Check logs
   docker-compose -f docker-compose-postgres.yml logs postgres
   ```

2. **Permission Denied**

   ```bash
   # Fix permissions
   chmod 600 .env
   chmod -R 755 postgres/
   ```

3. **Port Already in Use**

   ```bash
   # Check what's using port 5432
   lsof -i :5432

   # Stop conflicting service
   sudo systemctl stop postgresql
   ```

### **Debug Commands**

```bash
# Test database connection
docker exec sveltekit_postgres pg_isready -U app_user -d sveltekit_app

# View database logs
docker logs sveltekit_postgres

# Check Redis connection
docker exec sveltekit_redis redis-cli ping
```

---

## 📊 **Monitoring**

### **Health Check Endpoint**

```typescript
// src/routes/api/health/+server.ts
import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/database.js';

export async function GET() {
  try {
    await sql`SELECT 1`;
    return json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

---

## 🎉 **Success Metrics**

### **Performance Goals**

- ✅ **Database Response Time:** < 100ms
- ✅ **Authentication Speed:** < 2 seconds
- ✅ **Session Management:** < 500ms
- ✅ **Connection Pooling:** 10 concurrent users

### **Security Goals**

- ✅ **Password Hashing:** bcrypt with 12 rounds
- ✅ **Session Security:** HTTP-only cookies
- ✅ **SQL Injection:** Parameterized queries
- ✅ **XSS Prevention:** Input sanitization

---

## 🎯 **Next Steps**

1. **Test the authentication system** with the provided test user
2. **Customize the schema** for your specific app needs
3. **Add email verification** if needed
4. **Implement password reset** functionality
5. **Add user profile management**
6. **Set up monitoring** and alerting

---

## 📚 **Resources**

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SvelteKit Server Routes](https://kit.svelte.dev/docs/routing#server)
- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js/)

---

_Last Updated: July 20, 2025_
_Setup Guide Version: 1.0.0_
