# Supabase Setup Guide

## 🎯 **Quick Start**

### **1. Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Name**: `your-saas-name`
   - **Database Password**: `your-secure-password`
   - **Region**: Choose closest to you

### **2. Get Your Keys**

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **3. Update Environment Variables**

```bash
# Copy env.template to .env
cp env.template .env

# Edit .env with your Supabase keys
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🗄️ **Database Setup**

### **1. Create Tables**

Go to **SQL Editor** in Supabase Dashboard and run:

```sql
-- Enable Row Level Security
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

### **2. Set Up Storage**

1. Go to **Storage** in Supabase Dashboard
2. Create buckets:
   - `avatars` (for profile pictures)
   - `documents` (for file uploads)
   - `uploads` (for general uploads)

## 🔐 **Authentication Setup**

### **1. Configure Auth Settings**

1. Go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:5175`
   - **Redirect URLs**: `http://localhost:5175/auth/callback`
   - **Enable Email Confirmations**: Yes
   - **Enable Magic Link**: Yes

### **2. Social Login (Optional)**

1. Go to **Authentication** → **Providers**
2. Configure providers:
   - **Google**: Add Google OAuth credentials
   - **GitHub**: Add GitHub OAuth credentials
   - **Discord**: Add Discord OAuth credentials

## 📧 **Email Setup**

### **1. Configure SMTP Settings**

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure with your Mailgun settings:
   - **Host**: `smtp.mailgun.org`
   - **Port**: `587`
   - **Username**: `postmaster@your-domain.mailgun.org`
   - **Password**: Your Mailgun SMTP password

## 🚀 **Testing Your Setup**

### **1. Test Database Connection**

```typescript
// In your SvelteKit app
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Test connection
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

## 🔧 **Environment Variables**

### **Required Variables**

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_REGION=us

# Redis (Local)
REDIS_URL=redis://localhost:6379
```

## 🎯 **Next Steps**

1. ✅ **Set up Supabase project**
2. ✅ **Configure database tables**
3. ✅ **Set up authentication**
4. ✅ **Configure storage buckets**
5. ✅ **Test your connection**
6. 🚀 **Start building your SaaS!**

## 📚 **Useful Links**

- [Supabase Documentation](https://supabase.com/docs)
- [SvelteKit + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)
