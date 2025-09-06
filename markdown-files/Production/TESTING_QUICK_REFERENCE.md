# 🧪 Testing Quick Reference

## 🚀 Daily Development Workflow

```bash
# 1. Make changes to code
# 2. Quick validation (2-3 min)
npm run test:dev

# 3. If working on specific feature
npm run test:auth      # Authentication
npm run test:core      # Core functionality
npm run test:dashboard # Dashboard

# 4. Before committing
npm test              # Full regression (10-15 min)
```

## 🎯 Test Commands by Purpose

### Development (Fast Feedback)
```bash
npm run test:dev          # Essential tests only (2-3 min)
npm run test:helper       # Get recommendations
```

### Feature Testing
```bash
npm run test:auth         # Authentication module
npm run test:core         # Core application
npm run test:dashboard    # Dashboard functionality
npm run test:e2e          # End-to-end journeys
npm run test:pwa          # PWA functionality
```

### Integration & Production
```bash
npm test                  # Full regression (10-15 min)
npm run test:all          # All browsers (45-60 min)
```

### Debugging
```bash
npm run test:debug        # Debug mode
npm run test:ui           # UI mode
npm run test:headed       # See browser
npm run test:report       # View HTML report
```

## 📊 Test Levels Explained

| Level | Command | Duration | Purpose | When to Use |
|-------|---------|----------|---------|-------------|
| 🚀 Dev | `npm run test:dev` | 2-3 min | Quick validation | Daily development |
| 🎯 Feature | `npm run test:auth` | 1-2 min | Feature testing | Working on specific features |
| 🔍 Integration | `npm test` | 10-15 min | Full regression | Before committing |
| 🚨 Production | `npm run test:all` | 45-60 min | Production validation | Before deploying |

## 🎯 When to Use Each Level

### Working on Authentication?
```bash
npm run test:auth         # Test auth features
npm run test:dev          # Quick validation
```

### Working on Dashboard?
```bash
npm run test:dashboard    # Test dashboard features
npm run test:dev          # Quick validation
```

### Debugging an Issue?
```bash
npm run test:debug        # Debug mode
npm run test:ui           # UI mode
```

### Before Committing?
```bash
npm test                  # Full regression
```

### Before Deploying?
```bash
npm run test:all          # Production validation
```

## 🛠️ Helper Commands

```bash
# Get test recommendations
npm run test:helper recommend auth
npm run test:helper recommend debug
npm run test:helper recommend commit

# Check test status
npm run test:helper status

# View all options
npm run test:helper help
```

## 📈 Success Metrics

- **Development Tests**: >95% pass rate
- **Integration Tests**: >90% pass rate  
- **Production Tests**: >85% pass rate

## 🚨 Troubleshooting

### Tests Timing Out?
- Increase timeout in config
- Check if dev server is running
- Verify browser installation

### Flaky Tests?
- Add retries to config
- Fix race conditions
- Use more specific selectors

### Need Help?
```bash
npm run test:helper       # Get recommendations
npm run test:debug        # Debug mode
npm run test:ui           # UI mode
```

## 💡 Pro Tips

1. **Start with dev tests** - Get fast feedback
2. **Use feature tests** - Focus on what you're working on
3. **Run integration before commit** - Catch regressions
4. **Use production tests sparingly** - Save time for when it matters
5. **Use the helper** - `npm run test:helper` for guidance

---

**Remember**: The goal is to catch bugs early and often, while maintaining development velocity! 🚀
