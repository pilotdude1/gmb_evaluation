# Migration Guide: Local PostgreSQL → Supabase

## 🎯 **Why Migrate to Supabase?**

### **Benefits:**

- ✅ **Production-ready** from day one
- ✅ **Built-in authentication** and Row Level Security
- ✅ **Real-time subscriptions** out of the box
- ✅ **Edge functions** for serverless logic
- ✅ **Storage** replaces MinIO
- ✅ **No server maintenance**
- ✅ **Automatic backups**

### **Cost Comparison:**

| Service         | Local  | Supabase     |
| --------------- | ------ | ------------ |
| **Database**    | Free   | Free (500MB) |
| **Auth**        | Custom | Built-in     |
| **Storage**     | MinIO  | Built-in     |
| **Backups**     | Manual | Automatic    |
| **Maintenance** | High   | Zero         |

## 🚀 **Migration Steps**

### **Step 1: Set Up Supabase Project**

1. **Create Supabase Project**

   ```bash
   # Go to https://supabase.com
   # Create new project
   # Get your keys from Settings → API
   ```

2. **Update Environment Variables**

   ```bash
   # Copy template
   cp env.template .env

   # Edit .env with your Supabase keys
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### **Step 2: Database Migration**

1. **Export Local Data** (if you have existing data)

   ```bash
   # Export from local PostgreSQL
   pg_dump -h localhost -U postgres -d localsocialmax > backup.sql
   ```

2. **Create Supabase Tables**

   ```sql
   -- Run this in Supabase SQL Editor
   -- Enable RLS
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

   -- Create profiles table
   CREATE TABLE public.profiles (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     avatar_url TEXT,
     website TEXT,
     bio TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS on profiles
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY "Users can view own profile" ON public.profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON public.profiles
     FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Users can insert own profile" ON public.profiles
     FOR INSERT WITH CHECK (auth.uid() = id);

   -- Create function to handle new user signup
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, full_name)
     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Create trigger for new user signup
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. **Import Data** (if you have existing data)
   ```sql
   -- In Supabase SQL Editor, import your backup data
   -- Note: You may need to adjust user IDs to match Supabase auth.users
   ```

### **Step 3: Update Code**

1. **Remove PostgreSQL Dependencies**

   ```bash
   # Remove local PostgreSQL from docker-compose.yml
   # Use docker-compose-supabase.yml instead
   ```

2. **Update Database Queries**

   ```typescript
   // Before (local PostgreSQL)
   import { Pool } from 'pg';
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });

   // After (Supabase)
   import { supabase } from '$lib/supabaseClient';
   const { data, error } = await supabase.from('profiles').select('*');
   ```

3. **Update Authentication**

   ```typescript
   // Before (custom auth)
   // Custom login/signup logic

   // After (Supabase Auth)
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password',
   });
   ```

4. **Update File Storage**

   ```typescript
   // Before (MinIO)
   import { S3Client } from '@aws-sdk/client-s3';

   // After (Supabase Storage)
   import { storageService } from '$lib/supabaseStorage';
   const result = await storageService.uploadAvatar(userId, file);
   ```

### **Step 4: Update Docker Setup**

1. **Switch to Supabase Docker Compose**

   ```bash
   # Stop current stack
   ./docker-dev.sh stop

   # Use Supabase version
   ./docker-dev-supabase.sh start
   ```

2. **Update Environment Variables**
   ```bash
   # Remove PostgreSQL variables
   # Add Supabase variables
   # Keep Redis, Mailgun, etc.
   ```

## 🔧 **Code Changes Required**

### **1. Database Client**

```typescript
// src/lib/database.ts (if exists)
// Remove this file - use Supabase client instead
```

### **2. Authentication**

```typescript
// src/routes/auth/+page.svelte
import { supabase } from '$lib/supabaseClient';

// Replace custom auth with Supabase auth
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
});
```

### **3. File Uploads**

```typescript
// src/routes/profile/+page.svelte
import { storageService } from '$lib/supabaseStorage';

// Replace MinIO uploads with Supabase Storage
const result = await storageService.uploadAvatar(userId, file);
```

### **4. Real-time Features**

```typescript
// src/routes/dashboard/+page.svelte
import { supabase } from '$lib/supabaseClient';

// Add real-time subscriptions
const subscription = supabase
  .channel('profiles')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

## 🧪 **Testing Migration**

### **1. Test Database Connection**

```typescript
// Test in browser console
const { data, error } = await supabase.from('profiles').select('*').limit(1);

console.log('Connection test:', data, error);
```

### **2. Test Authentication**

```typescript
// Test signup
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
});

// Test signin
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123',
});
```

### **3. Test File Upload**

```typescript
// Test file upload
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
const result = await storageService.uploadGeneralFile(file);
console.log('Upload result:', result);
```

## 🎯 **Post-Migration Checklist**

- ✅ **Supabase project** created and configured
- ✅ **Environment variables** updated
- ✅ **Database tables** created with RLS
- ✅ **Authentication** working
- ✅ **File uploads** working
- ✅ **Real-time features** working
- ✅ **Local PostgreSQL** removed from stack
- ✅ **Docker setup** updated
- ✅ **Tests** passing

## 🚀 **Benefits After Migration**

1. **Production Ready**: Same database in dev and production
2. **Built-in Features**: Auth, storage, real-time, edge functions
3. **Security**: Row Level Security out of the box
4. **Scalability**: Automatic scaling and backups
5. **Cost Effective**: Free tier covers most development needs

## 📚 **Next Steps**

1. **Set up Supabase project** following `SUPABASE_SETUP.md`
2. **Update your code** to use Supabase APIs
3. **Test all features** thoroughly
4. **Deploy to production** with confidence!

Your SaaS is now ready for production! 🎉
