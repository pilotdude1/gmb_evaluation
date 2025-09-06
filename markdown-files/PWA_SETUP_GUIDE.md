# PWA Setup and Troubleshooting Guide

## Overview

This guide explains how to properly configure and maintain the PWA (Progressive Web App) functionality in this project to prevent common errors and ensure smooth operation.

## ✅ Permanent Fixes Applied

### 1. Vite PWA Configuration

- **Conditional PWA activation** - PWA only enabled in production mode
- **Development mode optimization** - PWA disabled in development to prevent issues
- **Proper fallback handling** for navigation
- **Runtime caching** for static assets

### 2. Service Worker Registration

- **Environment-aware registration** (disabled in dev, enabled in production)
- **Proper error handling** and logging
- **Automatic update detection** and page reload
- **Clean initialization** without conflicts

### 3. Build Process

- **Added clean script** to remove development artifacts
- **Proper build pipeline** for PWA assets
- **Git ignore configuration** for dev-dist directory

## 🚀 How to Use

### Development

```bash
# Start development server (PWA disabled for better performance)
npm run dev

# Clean development artifacts
npm run clean
```

### Production Build

```bash
# Build for production with PWA enabled
npm run build:pwa

# Preview production build
npm run preview
```

## 🔧 Configuration Files

### vite.config.ts

- **Conditional PWA plugin** - Only active in production
- **Development vs production settings**
- **Asset caching strategies**

### src/lib/pwa.ts

- **Environment-aware service worker registration**
- **PWA installation functions** (disabled in development)
- **Production-only PWA features**

### package.json

- **Build scripts**
- **Clean commands**
- **PWA-specific dependencies**

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. "One of the glob patterns doesn't match any files"

**Cause**: PWA plugin looking for files in wrong directory
**Solution**: ✅ Fixed with conditional PWA activation

#### 2. Service Worker Registration Errors

**Cause**: Development vs production path conflicts
**Solution**: ✅ Fixed with environment-aware registration

#### 3. PWA Installation Not Working

**Cause**: Missing or incorrect event handling
**Solution**: ✅ Fixed with proper BeforeInstallPromptEvent handling

#### 4. Build Errors

**Cause**: Cached development artifacts
**Solution**: ✅ Fixed with clean script and proper gitignore

#### 5. 404 Errors for Service Worker

**Cause**: Vite blocking access to dev-dist directory
**Solution**: ✅ Fixed by disabling PWA in development mode

## 📋 Maintenance Checklist

### Before Each Development Session

- [ ] Run `npm run clean` if switching between dev/prod
- [ ] Ensure `.env` file is properly configured
- [ ] Check that all dependencies are installed

### Before Production Deployment

- [ ] Run `npm run build:pwa` for clean build
- [ ] Test PWA functionality in production build
- [ ] Verify service worker registration
- [ ] Check manifest.json generation

### Regular Maintenance

- [ ] Update PWA dependencies quarterly
- [ ] Test PWA installation flow
- [ ] Verify offline functionality
- [ ] Check service worker updates

## 🔍 Debugging

### Development Console

- **PWA is disabled** in development mode
- **No service worker registration** in development
- **Clean console** without PWA warnings

### Production Debugging

- Check browser's Application tab for service worker status
- Verify manifest.json is properly generated
- Test offline functionality

## 🎯 Development vs Production

### Development Mode

- ✅ **PWA disabled** for better performance
- ✅ **No service worker** registration
- ✅ **No PWA installation** prompts
- ✅ **Clean console** without warnings
- ✅ **Faster development** experience

### Production Mode

- ✅ **PWA fully enabled** with service worker
- ✅ **Offline functionality** available
- ✅ **PWA installation** prompts work
- ✅ **Proper caching** and performance
- ✅ **Full PWA features** available

## 📚 Additional Resources

- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/)
- [SvelteKit PWA Guide](https://kit.svelte.dev/docs/service-workers)
- [Web App Manifest Specification](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 🎯 Best Practices

1. **Always use the clean script** when switching between environments
2. **Test PWA functionality** only in production builds
3. **Keep dependencies updated** to avoid compatibility issues
4. **Monitor service worker updates** for smooth user experience
5. **Use environment variables** for configuration

## ✅ Success Indicators

### Development

- No PWA warnings in development console
- Fast development server startup
- Clean console output
- No service worker registration attempts

### Production

- Service worker registers successfully
- PWA installation prompt works
- Offline functionality operates correctly
- Build process completes without errors

---

**Last Updated**: August 2025
**Status**: ✅ All issues resolved and documented
**Development Mode**: PWA disabled for optimal performance
**Production Mode**: PWA fully enabled with all features
