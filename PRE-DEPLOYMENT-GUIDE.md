# 🚀 LPlate Pre-Deployment Guide

## Overview
This guide outlines the pre-deployment process for LPlate, ensuring clean deployments to Vercel with minimal issues. Based on lessons learned from v3.13 deployment.

## 📋 Pre-Deployment Checklist

### 1. **Code Quality Checks**
```bash
# Run basic verification (recommended for quick checks)
npm run ci:verify

# Run full verification (includes build + tests)
npm run ci:verify-full
```

**What it checks:**
- ✅ Dependencies installation (`pnpm install --frozen-lockfile`)
- ✅ TypeScript compilation (`npm run typecheck`)
- ✅ ESLint validation (`npm run lint`)
- ✅ Build process (`npm run build`) - *Full version only*
- ✅ Smoke tests (`npm run test:smoke`) - *Full version only*

### 2. **Critical Issues to Check**

#### **Next.js Static Generation Issues**
- **Problem**: `useSearchParams()` without Suspense boundary
- **Solution**: Wrap components using `useSearchParams()` in `<Suspense>`
- **Example Fix**:
```tsx
// ❌ BAD - Causes build failure
export default function MyPage() {
  const params = useSearchParams();
  // ...
}

// ✅ GOOD - Works with static generation
function MyPageForm() {
  const params = useSearchParams();
  // ...
}

export default function MyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MyPageForm />
    </Suspense>
  );
}
```

#### **Package Manager Compatibility**
- **Issue**: Using `npm ci` with `pnpm` projects
- **Solution**: Use `pnpm install --frozen-lockfile` in CI scripts
- **Check**: Verify `pnpm-lock.yaml` exists (not `package-lock.json`)

#### **External Image Configuration**
- **Requirement**: `next.config.ts` must allow external domains
- **Current Config**:
```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" }, // Allow all HTTPS
    ],
  },
};
```

### 3. **Health Monitoring Setup**

#### **Health Endpoint**
- **URL**: `/api/health`
- **Response**: `{ ok: true, ts: Date.now(), status: 'healthy', timestamp: 'ISO string' }`
- **Purpose**: Uptime monitoring and deployment verification

#### **Smoke Tests**
- **Location**: `tests/smoke.test.ts`
- **Coverage**: Homepage, health endpoint, search page, auth pages
- **Run**: `npm run test:smoke`

### 4. **Windows Development Considerations**

#### **Known Issues**
- **Build Process**: `.next\trace` permission errors on Windows
- **Solution**: Use `ci:verify` (without build) for local testing
- **Deployment**: Vercel runs on Linux, so Windows issues don't affect production

#### **Recommended Workflow**
```bash
# Local development (Windows)
npm run ci:verify          # Skip build, test core functionality

# Before pushing
npm run ci:verify-full     # Full check (may fail on Windows)
git add . && git commit -m "..." && git push
```

### 5. **Deployment Process**

#### **Step-by-Step**
1. **Pre-commit**: Run `npm run ci:verify`
2. **Commit**: Stage changes and commit with descriptive message
3. **Push**: `git push origin main`
4. **Monitor**: Check Vercel dashboard for build status
5. **Verify**: Test `/api/health` endpoint on live site

#### **Rollback Plan**
- **Vercel**: Use dashboard to rollback to previous deployment
- **Git**: `git revert <commit-hash>` and push
- **Database**: Supabase changes are versioned and reversible

### 6. **Common Deployment Issues & Solutions**

#### **Build Failures**
| Error | Cause | Solution |
|-------|-------|----------|
| `useSearchParams() should be wrapped in suspense` | Missing Suspense boundary | Wrap component in `<Suspense>` |
| `EPERM: operation not permitted, open '.next\trace'` | Windows permission issue | Use `ci:verify` instead of `ci:verify-full` |
| `npm ci` with pnpm project | Wrong package manager | Use `pnpm install --frozen-lockfile` |
| External image blocked | Missing remotePatterns | Update `next.config.ts` |

#### **Runtime Issues**
| Issue | Symptoms | Solution |
|-------|----------|----------|
| Images not loading | Broken image URLs | Check `next.config.ts` remotePatterns |
| Health endpoint down | 500 errors | Check API route implementation |
| Auth redirects failing | Login loops | Verify Supabase auth configuration |

### 7. **Performance Considerations**

#### **Build Optimization**
- **Static Generation**: Ensure pages can be prerendered
- **Image Optimization**: Use `next/image` instead of `<img>` tags
- **Bundle Size**: Monitor with `npm run build` output

#### **Runtime Performance**
- **API Routes**: Keep `/api/health` lightweight
- **Database Queries**: Optimize Supabase queries
- **Client-side**: Minimize JavaScript bundle size

### 8. **Monitoring & Maintenance**

#### **Post-Deployment Checks**
1. **Health Check**: Visit `/api/health` on live site
2. **Core Pages**: Test homepage, search, auth flows
3. **Mobile**: Verify responsive design on 375px width
4. **Performance**: Check Core Web Vitals

#### **Ongoing Maintenance**
- **Dependencies**: Regular `pnpm update`
- **Security**: Monitor for vulnerabilities
- **Performance**: Track build times and bundle sizes

## 🎯 **Quick Reference**

### **Commands**
```bash
# Basic verification (recommended)
npm run ci:verify

# Full verification (production)
npm run ci:verify-full

# Health check
curl https://your-domain.vercel.app/api/health

# Local development
pnpm dev
```

### **Key Files**
- `package.json` - CI scripts and dependencies
- `next.config.ts` - Build configuration
- `src/app/api/health/route.ts` - Health endpoint
- `tests/smoke.test.ts` - Smoke tests
- `playwright.config.ts` - Test configuration

### **Environment Variables**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations

## 📚 **Lessons Learned (v3.13)**

1. **Suspense Boundaries**: Always wrap `useSearchParams()` components
2. **Package Managers**: Match CI scripts to project's package manager
3. **Windows Limitations**: Use appropriate verification level for OS
4. **External Images**: Configure `remotePatterns` for all external domains
5. **Health Monitoring**: Essential for deployment verification
6. **Incremental Testing**: Test components individually before full integration

---

**Last Updated**: October 2025 (v3.13)
**Next Review**: After next major deployment
