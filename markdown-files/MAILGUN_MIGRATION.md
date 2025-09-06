# 📧 Migrating from MailHog to Mailgun

This guide explains how to switch from MailHog (development email testing) to Mailgun (production email service).

## 🔄 **Why Switch to Mailgun?**

### **MailHog (Development)**

- ✅ **Easy setup** - No configuration needed
- ✅ **Email capture** - See all sent emails
- ✅ **No external dependencies** - Runs locally
- ❌ **Development only** - Not for production
- ❌ **No delivery** - Emails don't reach real users

### **Mailgun (Production)**

- ✅ **Real email delivery** - Emails reach users
- ✅ **Professional service** - High deliverability
- ✅ **Analytics** - Track opens, clicks, bounces
- ✅ **Templates** - Beautiful HTML emails
- ✅ **Webhooks** - Real-time event tracking
- ❌ **Requires setup** - API key and domain
- ❌ **Cost** - Pay per email sent

## 🚀 **Migration Steps**

### **1. Set Up Mailgun Account**

1. **Sign up** at [mailgun.com](https://mailgun.com)
2. **Add your domain** to Mailgun
3. **Verify domain** ownership
4. **Get API key** from dashboard

### **2. Update Environment Variables**

```bash
# Add to your .env file
VITE_MAILGUN_API_KEY=your_mailgun_api_key_here
VITE_MAILGUN_DOMAIN=your_domain.com
VITE_MAILGUN_REGION=us  # or eu
```

### **3. Remove MailHog from Docker**

The `docker-compose.yml` has been updated to remove MailHog and add Mailgun environment variables to the app service.

### **4. Use the Email Service**

```typescript
import { EmailService } from '$lib/emailService';

// Send welcome email
await EmailService.sendWelcomeEmail('user@example.com', 'John Doe');

// Send password reset
await EmailService.sendPasswordResetEmail(
  'user@example.com',
  'https://reset-link.com'
);

// Send magic link
await EmailService.sendMagicLinkEmail(
  'user@example.com',
  'https://magic-link.com'
);
```

## 📧 **Email Templates Included**

### **Welcome Email**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #3B82F6;">Welcome to LocalSocialMax!</h2>
  <p>Hi {{name}},</p>
  <p>
    Thank you for joining LocalSocialMax. We're excited to have you on board!
  </p>
  <p>If you have any questions, feel free to reach out to our support team.</p>
  <br />
  <p>Best regards,<br />The LocalSocialMax Team</p>
</div>
```

### **Password Reset Email**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #3B82F6;">Password Reset Request</h2>
  <p>You requested a password reset for your LocalSocialMax account.</p>
  <p>Click the button below to reset your password:</p>
  <a
    href="{{resetUrl}}"
    style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;"
    >Reset Password</a
  >
  <p>If you didn't request this reset, you can safely ignore this email.</p>
  <p>This link will expire in 1 hour.</p>
</div>
```

### **Magic Link Email**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #3B82F6;">Your Magic Link</h2>
  <p>Click the button below to sign in to LocalSocialMax:</p>
  <a
    href="{{magicLink}}"
    style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;"
    >Sign In</a
  >
  <p>This link will expire in 1 hour.</p>
  <p>If you didn't request this link, you can safely ignore this email.</p>
</div>
```

## 🔧 **Configuration Options**

### **Environment Variables**

```bash
# Required
VITE_MAILGUN_API_KEY=your_api_key
VITE_MAILGUN_DOMAIN=your_domain.com

# Optional
VITE_MAILGUN_REGION=us  # or eu
```

### **Docker Compose**

```yaml
environment:
  - MAILGUN_API_KEY=${MAILGUN_API_KEY}
  - MAILGUN_DOMAIN=${MAILGUN_DOMAIN}
  - MAILGUN_REGION=${MAILGUN_REGION:-us}
```

## 📊 **Mailgun Features**

### **Analytics Dashboard**

- **Delivery rates** - Track email delivery
- **Open rates** - See who opens emails
- **Click rates** - Track link clicks
- **Bounce rates** - Monitor failed deliveries

### **Webhooks**

```typescript
// Handle email events
app.post('/webhooks/mailgun', (req, res) => {
  const { event-data } = req.body;

  switch (event-data.event) {
    case 'delivered':
      console.log('Email delivered');
      break;
    case 'opened':
      console.log('Email opened');
      break;
    case 'clicked':
      console.log('Link clicked');
      break;
  }
});
```

### **Email Validation**

```typescript
// Validate email addresses
const isValid = await EmailService.validateEmail('user@example.com');
```

## 🧪 **Testing**

### **Development Testing**

```typescript
// Test email sending
const success = await EmailService.sendWelcomeEmail(
  'test@example.com',
  'Test User'
);
console.log('Email sent:', success);
```

### **Production Monitoring**

1. **Check Mailgun dashboard** for delivery status
2. **Monitor bounce rates** and fix issues
3. **Track open rates** to improve templates
4. **Set up alerts** for delivery failures

## 💰 **Cost Considerations**

### **Mailgun Pricing**

- **Free tier**: 5,000 emails/month for 3 months
- **Pay-as-you-go**: $0.80 per 1,000 emails
- **Volume discounts** available

### **Cost Optimization**

- **Use templates** to reduce development time
- **Monitor bounce rates** to maintain list health
- **Segment your audience** for better targeting
- **A/B test** subject lines and content

## 🔄 **Rollback Plan**

If you need to switch back to MailHog for development:

1. **Add MailHog service** back to `docker-compose.yml`
2. **Update environment variables** to use MailHog
3. **Modify email service** to use SMTP instead of API
4. **Test locally** before deploying

## ✅ **Migration Checklist**

- [ ] **Set up Mailgun account**
- [ ] **Add and verify domain**
- [ ] **Get API key**
- [ ] **Update environment variables**
- [ ] **Remove MailHog from Docker**
- [ ] **Test email sending**
- [ ] **Update email templates**
- [ ] **Set up webhooks** (optional)
- [ ] **Monitor delivery rates**
- [ ] **Configure alerts**

---

**Ready to send real emails to your users!** 📧

The migration from MailHog to Mailgun is straightforward and provides a professional email service for your SaaS application.
