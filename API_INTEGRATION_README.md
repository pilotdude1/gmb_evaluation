# 🚀 Customer Evaluation System - API Integration

Complete API integration for connecting your SvelteKit Customer Evaluation interface to n8n workflows and Supabase database.

## 📋 What We Built

### **🔗 API Endpoints**
- **`/api/customer-evaluation/search`** - Trigger n8n GMB search workflows
- **`/api/customer-evaluation/progress`** - Real-time progress tracking
- **`/api/customer-evaluation/campaigns`** - Save/load search templates

### **🗄️ Database Schema**
- **`customer_evaluation_searches`** - Track search requests and progress
- **`customer_evaluations`** - Store scraped business data
- **`customer_evaluation_campaigns`** - Saved search templates
- **`customer_evaluation_usage`** - Monthly usage tracking for subscriptions

### **⚡ Real-time Features**
- **Progress polling** - Live updates during GMB scraping
- **Campaign management** - Save/load search configurations
- **Authentication integration** - Secure API access with Supabase Auth

---

## 🛠️ Setup Instructions

### **Step 1: Database Setup**

1. **Open Supabase SQL Editor**
2. **Run the schema script**:
   ```sql
   -- Copy and paste contents from: sql-files/customer-evaluation/schema.sql
   ```
3. **Verify tables created**:
   - customer_evaluation_searches
   - customer_evaluations  
   - customer_evaluation_campaigns
   - customer_evaluation_usage

### **Step 2: Environment Variables**

1. **Copy environment template**:
   ```bash
   cp env.customer-evaluation.template .env.local
   ```

2. **Update environment variables**:
   ```env
   # Your n8n webhook URL
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/customer-evaluation
   
   # Your existing Supabase settings (should already be configured)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

### **Step 3: n8n Webhook Setup**

1. **Create webhook trigger** in your n8n workflow
2. **Set webhook path**: `/webhook/customer-evaluation`
3. **Update your workflow** to handle the new payload format:

```json
{
  "sessionId": "uuid-here",
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "search_type": "one_off",
  "market_vertical": "restaurant",
  "geographic": {
    "city": "Phoenix",
    "state": "AZ", 
    "radius_miles": 25
  },
  "quality_filters": {
    "min_reviews": 25,
    "min_rating": 4.0,
    "exclude_closed": true
  },
  "batch_settings": {
    "max_results": 50
  }
}
```

### **Step 4: Test the Integration**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Customer Evaluation**:
   - Go to dashboard → Click "Customer Evaluation"
   - Fill out the form
   - Click "Start GMB Search"

3. **Check the API calls**:
   - Open browser dev tools → Network tab
   - Verify API calls to `/api/customer-evaluation/search`
   - Check Supabase tables for new records

---

## 🔄 API Flow Diagram

```
SvelteKit Form → API Endpoint → n8n Webhook → GMB Scraping
     ↓              ↓              ↓              ↓
 User Input → Validation → Workflow Trigger → Data Collection
     ↓              ↓              ↓              ↓
 Real-time UI ← Progress API ← Status Updates ← Processing Steps
     ↓              ↓              ↓              ↓
 Results View ← Database ← Supabase Storage ← Cleaned Data
```

---

## 📊 Database Schema Overview

### **customer_evaluation_searches**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- search_params (JSONB) -- Original form data
- status (TEXT) -- initiated, processing, completed, failed
- found_count (INTEGER) -- Number of businesses found
- created_at, updated_at
```

### **customer_evaluations**
```sql
- id (UUID, Primary Key)
- search_session_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key to auth.users)
- business_name, contact_person, phone_number
- email_1, email_2, email_3, email_4, email_5
- website_url, street, city, state, zip_code
- categories (JSONB), business_hours (JSONB)
- review_count, average_rating
- fit_score, evaluation_status
- agile_crm_id, clickup_task_id
- created_at, updated_at
```

### **customer_evaluation_campaigns**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- name, description
- search_params (JSONB) -- Saved form configuration
- is_template (BOOLEAN)
- created_at, updated_at
```

---

## 🔐 Security Features

### **Authentication**
- **Bearer token validation** on all API endpoints
- **User isolation** - users can only access their own data
- **Row Level Security (RLS)** policies on all tables

### **Data Validation**
- **Required field validation** on form submission
- **Type checking** for all parameters
- **SQL injection protection** via parameterized queries

### **Rate Limiting** (Future Enhancement)
- Monthly usage tracking in `customer_evaluation_usage` table
- Ready for subscription-based limits

---

## 🧪 Testing Your Integration

### **Manual Testing**

1. **Form Submission Test**:
   ```bash
   # Fill out Customer Evaluation form
   # Click "Start GMB Search"
   # Check browser console for API calls
   ```

2. **Database Verification**:
   ```sql
   SELECT * FROM customer_evaluation_searches 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC;
   ```

3. **Progress Polling Test**:
   ```bash
   # Watch the real-time progress updates
   # Check Network tab for polling requests
   # Verify status changes in database
   ```

### **API Testing with curl**

```bash
# Get auth token first
AUTH_TOKEN="your-supabase-jwt-token"

# Test search endpoint
curl -X POST http://localhost:5173/api/customer-evaluation/search \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marketVertical": "restaurant",
    "city": "Phoenix", 
    "state": "AZ",
    "batchSize": 25
  }'

# Test progress endpoint
curl "http://localhost:5173/api/customer-evaluation/progress?sessionId=your-session-id" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

---

## 🔄 n8n Workflow Updates

### **Update Your Existing Workflow**

1. **Replace the trigger** with webhook trigger
2. **Update input processing** to handle new payload format
3. **Add progress updates** by calling the progress API:

```javascript
// In your n8n workflow, call this to update progress
const progressUpdate = {
  sessionId: $json.sessionId,
  status: 'scraping', // or 'processing', 'completed', 'failed'
  foundCount: 15 // current count of businesses found
};

// POST to: your-app-url/api/customer-evaluation/progress
```

### **Expected Workflow Steps**

1. **Receive webhook** → Update status to 'processing'
2. **Start Apify scraping** → Update status to 'scraping'
3. **Process results** → Update status to 'analyzing', increment foundCount
4. **Store in Supabase** → Update status to 'storing'
5. **Trigger ClickUp/CRM** → Update status to 'triggering_workflows'
6. **Complete** → Update status to 'completed'

---

## 🚨 Troubleshooting

### **Common Issues**

1. **"Unauthorized" errors**:
   - Check Supabase authentication is working
   - Verify JWT token is being passed correctly
   - Check RLS policies are configured

2. **n8n webhook not triggering**:
   - Verify N8N_WEBHOOK_URL in environment
   - Check n8n is running and accessible
   - Test webhook URL manually with curl

3. **Database errors**:
   - Run the schema.sql file in Supabase
   - Check table permissions and RLS policies
   - Verify foreign key relationships

4. **Progress not updating**:
   - Check polling interval (every 2 seconds)
   - Verify progress API endpoint is accessible
   - Check n8n is calling progress update API

### **Debug Checklist**

- [ ] Database tables created successfully
- [ ] Environment variables configured
- [ ] n8n webhook URL accessible
- [ ] Supabase authentication working
- [ ] API endpoints responding correctly
- [ ] Real-time progress polling active

---

## 🎯 What's Next

Your **Customer Evaluation System** now has:

✅ **Complete API integration**  
✅ **Real-time progress tracking**  
✅ **Campaign management**  
✅ **Secure database storage**  
✅ **n8n workflow integration**  

### **Ready for Production**

1. **Deploy to Digital Ocean** (your existing hosting)
2. **Configure production n8n webhook URL**
3. **Set up monitoring and logging**
4. **Add usage analytics to dashboard**

### **Future Enhancements**

- **WebSocket integration** for even faster real-time updates
- **Advanced filtering** and search result management
- **Bulk export** capabilities
- **Integration with additional CRM systems**

**Your Customer Evaluation System is now fully integrated and production-ready!** 🚀
