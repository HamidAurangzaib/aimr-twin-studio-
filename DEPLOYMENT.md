# 🚀 Deploying AIMR Twin Studio™ to Vercel

This guide will walk you through deploying your AIMR Twin Studio™ application to Vercel with proper environment variable configuration.

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ A [Vercel account](https://vercel.com/signup) (free tier works great!)
- ✅ A [GitHub account](https://github.com/signup)
- ✅ Your Gemini API key (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- ✅ Git installed on your computer

---

## 🔐 Step 1: Secure Your API Key on GitHub

> [!CAUTION]
> **NEVER commit your API key to GitHub!** This is critical for security.

### Verify Your `.gitignore` is Protecting Your Secrets

1. Open your `.gitignore` file and confirm it includes:
   ```
   *.local
   .env
   .env.local
   .env.*.local
   ```

2. **Check what Git is tracking** by running:
   ```bash
   git status
   ```
   
3. **Verify `.env.local` is NOT listed** in the output. If it is, STOP and remove it:
   ```bash
   git rm --cached .env.local
   ```

### Push Your Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   ```

2. **Add your files**:
   ```bash
   git add .
   ```

3. **Commit your changes**:
   ```bash
   git commit -m "Initial commit - Ready for Vercel deployment"
   ```

4. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Name it `aimr-twin-studio` (or your preferred name)
   - Choose **Public** or **Private** (your choice)
   - **DO NOT** initialize with README (you already have one)
   - Click "Create repository"

5. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/aimr-twin-studio.git
   git branch -M main
   git push -u origin main
   ```

6. **Double-check on GitHub**:
   - Visit your repository on GitHub
   - **Verify that `.env.local` is NOT visible** in the file list
   - If you see it, DELETE it immediately from GitHub and your local git history

---

## 🌐 Step 2: Deploy to Vercel

### Connect Your GitHub Repository

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import your GitHub repository**:
   - Click "Import" next to your `aimr-twin-studio` repository
   - If you don't see it, click "Adjust GitHub App Permissions" to grant access

### Configure Your Project

4. **Project Settings**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)

5. **Environment Variables** (CRITICAL STEP):
   - Click "Environment Variables" section
   - Add the following variable:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: Your actual Gemini API key (paste it here)
     - **Environments**: Check all (Production, Preview, Development)
   
   > [!IMPORTANT]
   > This is where your API key lives securely. Vercel encrypts it and never exposes it in logs or the UI after you save it.

6. **Click "Deploy"**

   Vercel will now:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your project (`npm run build`)
   - Deploy to a global CDN

---

## ✅ Step 3: Verify Your Deployment

### Check Deployment Status

1. **Wait for deployment to complete** (usually 1-2 minutes)
   - You'll see a success screen with confetti 🎉

2. **Click "Visit"** to open your deployed app

3. **Test the application**:
   - Verify the UI loads correctly
   - Test the Gemini API integration (generate an image or use AI features)
   - Check browser console for any errors (F12 → Console tab)

### Your Deployment URLs

Vercel provides multiple URLs:

- **Production**: `https://aimr-twin-studio.vercel.app` (or your custom domain)
- **Preview**: Unique URL for each branch/PR (e.g., `https://aimr-twin-studio-git-dev.vercel.app`)

---

## 🔄 Step 4: Redeploy After Changes

### Automatic Deployments

Every time you push to GitHub, Vercel automatically redeploys:

```bash
# Make your changes
git add .
git commit -m "Updated feature X"
git push
```

Vercel will:
- Detect the push
- Rebuild your app
- Deploy the new version
- Keep the same environment variables

### Manual Redeployment

To redeploy without code changes:

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Deployments" tab
3. Click "..." on the latest deployment
4. Click "Redeploy"

---

## 🔧 Troubleshooting

### Build Fails with "GEMINI_API_KEY is not defined"

**Solution**: Add the environment variable in Vercel:
1. Go to Project Settings → Environment Variables
2. Add `GEMINI_API_KEY` with your API key
3. Redeploy

### API Calls Fail in Production

**Symptoms**: Works locally but not on Vercel

**Solution**: Check environment variable configuration:
1. Verify `GEMINI_API_KEY` is set in Vercel dashboard
2. Make sure it's enabled for "Production" environment
3. Check browser console for CORS or API errors
4. Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)

### 404 Errors on Page Refresh

**Symptoms**: Direct URLs or page refreshes return 404

**Solution**: This should be handled by `vercel.json`, but if it persists:
1. Verify `vercel.json` exists in your repository
2. Check that it contains the `rewrites` configuration
3. Redeploy after confirming the file is committed

### Build Command Not Found

**Solution**: Ensure `package.json` has the build script:
```json
"scripts": {
  "build": "vite build"
}
```

---

## 🎯 Environment Variables Reference

Your application uses these environment variables:

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `GEMINI_API_KEY` | Google Gemini API authentication | Vercel Dashboard → Environment Variables |

### How Vite Handles Environment Variables

In your `vite.config.ts`, the environment variable is exposed as:
```typescript
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```

This means in your code, you access it as:
```typescript
const apiKey = process.env.GEMINI_API_KEY;
```

---

## 🌟 Best Practices

### Security

- ✅ **Never commit** `.env.local` or any file with API keys
- ✅ **Use Vercel's environment variables** for all secrets
- ✅ **Rotate your API key** if it's ever exposed
- ✅ **Enable API key restrictions** in Google Cloud Console (optional but recommended)

### Performance

- ✅ **Enable Vercel Analytics** for performance insights
- ✅ **Use Vercel's Edge Network** for global performance
- ✅ **Monitor build times** and optimize if needed

### Workflow

- ✅ **Use branches** for development (`git checkout -b feature/new-feature`)
- ✅ **Preview deployments** automatically test each branch
- ✅ **Merge to main** only after preview testing

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the [Vercel Deployment Logs](https://vercel.com/docs/concepts/deployments/logs)
2. Review the [Troubleshooting](#-troubleshooting) section above
3. Visit [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**🎉 Congratulations!** Your AIMR Twin Studio™ is now live on Vercel!
