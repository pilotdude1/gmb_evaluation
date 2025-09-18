# 🚀 Complete Setup Guide: GMB Evaluation CRM

## 🔧 **Where to Put Your API Keys and Webhook Data**

### **Step 1: Create Your Environment File**

```bash
# Copy the complete template
cp env.complete.template .env
```

### **Step 2: Fill in Your .env File**

Here's what each section is for:

```env
# =================================================================
# SUPABASE CONFIGURATION (Required)
# =================================================================
# Get these from: https://supabase.com/dashboard → Your Project → Settings → API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =================================================================
# SECURITY SECRETS (Use the generated ones above)
# =================================================================
CSRF_SECRET=0da2a2c846a61fe37462b5f98be96da3ee4cfb298cb02d1fdad95dd475bd8ad8
JWT_SECRET=12fae1dab3bd83eb84b73d7871025a990e2abc873a65c0fd313025f05bbda6a9
CUSTOMER_EVALUATION_API_SECRET=f98391fb0b7b91d726d722c9a0f45b5e6ed200fbc01674f1c0e6ff0cc2167106
APIFY_WEBHOOK_SECRET=447a92a5f1bc27ab8088fd9efd0269b37d0d645a3ad7d90e2b8f2f4028294825

# =================================================================
# APIFY INTEGRATION (Required for GMB Scraping)
# =================================================================
# Get from: https://console.apify.com/account/integrations
APIFY_API_TOKEN=apify_api_your_token_here

# Apify Actor IDs (these are public, you can use them as-is)
APIFY_GMB_SCRAPER_ACTOR_ID=apify/google-maps-scraper
APIFY_PLACES_SCRAPER_ACTOR_ID=apify/google-places-scraper
APIFY_REVIEWS_SCRAPER_ACTOR_ID=apify/google-maps-reviews-scraper

# =================================================================
# N8N WEBHOOK CONFIGURATION
# =================================================================
# Your n8n instance URLs
N8N_WEBHOOK_URL=http://localhost:5678/webhook/customer-evaluation
N8N_API_KEY=your_n8n_api_key_if_needed
N8N_BASE_URL=http://localhost:5678

# =================================================================
# MAILGUN (For Email Campaigns)
# =================================================================
# Get from: https://app.mailgun.com/mg/dashboard
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain_here
MAILGUN_REGION=us

# =================================================================
# DEVELOPMENT SETTINGS
# =================================================================
NODE_ENV=development
```

## 🔗 **How to Get Each API Key**

### **1. Supabase Keys**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

### **2. Apify API Token**

1. Go to [console.apify.com](https://console.apify.com)
2. Sign up/Login
3. Go to **Account** → **Integrations**
4. Copy your **API Token** → `APIFY_API_TOKEN`

### **3. Mailgun Keys (Optional, for email campaigns)**

1. Go to [app.mailgun.com](https://app.mailgun.com)
2. Sign up for free account
3. Go to **Dashboard**
4. Copy:
   - **API Key** → `MAILGUN_API_KEY`
   - **Domain** → `MAILGUN_DOMAIN`

### **4. N8N Setup (Workflow Automation)**

1. Install n8n locally: `npm install -g n8n`
2. Start n8n: `n8n start`
3. Access at `http://localhost:5678`
4. Create webhook workflows
5. Use webhook URLs in your config

## 🔄 **Webhook Configuration**

### **Apify Webhooks**

Your Apify webhook endpoint is already created at:

```
https://your-domain.com/api/webhooks/apify
```

In your Apify actors, set the webhook URL to notify when runs complete.

### **N8N Webhooks**

Create workflows in n8n with webhook triggers:

- GMB Search: `/webhook/customer-evaluation`
- Lead Processing: `/webhook/lead-processing`
- CRM Sync: `/webhook/crm-sync`

## 🔒 **Security Best Practices**

### **1. Never Commit .env to Git**

```bash
# Add to .gitignore (already there)
.env
.env.local
.env.production
```

### **2. Use Different Secrets for Production**

Generate new secrets for production:

```bash
# Generate production secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **3. Rotate Secrets Regularly**

- Change secrets every 3-6 months
- Immediately rotate if compromised
- Use different secrets per environment

## 🧪 **Testing Your Setup**

### **1. Test Supabase Connection**

```bash
# Start your app
npm run dev

# Check console for connection errors
# Visit http://localhost:5173
```

### **2. Test Apify Integration**

1. Go to Customer Evaluation page
2. Fill out GMB search form
3. Check browser dev tools for API calls
4. Verify data appears in Supabase tables

### **3. Test Webhooks**

```bash
# Test Apify webhook
curl -X POST http://localhost:5173/api/webhooks/apify \
  -H "Content-Type: application/json" \
  -d '{"eventType":"ACTOR_RUN_SUCCEEDED","resource":{"id":"test"}}'
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Unauthorized" errors**

   - Check Supabase keys are correct
   - Verify user is authenticated
   - Check RLS policies

2. **Webhook not receiving data**

   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Look at server logs

3. **Apify runs not starting**
   - Check API token is valid
   - Verify actor ID is correct
   - Check Apify account credits

### **Debug Commands:**

```bash
# Check environment variables
node -e "console.log(process.env.APIFY_API_TOKEN?.substring(0,10) + '...')"

# Test webhook endpoint
curl -X POST http://localhost:5173/api/webhooks/apify

# Check database tables
# Use Supabase dashboard SQL editor
```

## 🎯 **Next Steps**

1. ✅ Set up all environment variables
2. ✅ Test Supabase connection
3. ✅ Deploy database migrations
4. ✅ Test GMB search functionality
5. ✅ Set up n8n workflows
6. ✅ Configure email campaigns
7. 🚀 Start scraping and building your CRM!

---

**Your GMB Evaluation CRM is ready to go!** 🚀
