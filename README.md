<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1qVxeU16zuvtymVvxoXS2JP1y2DK7xDVs

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🚀 Deploy to Vercel

Deploy your app to Vercel in minutes! See the comprehensive [Deployment Guide](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Push your code to GitHub (make sure `.env.local` is NOT committed!)
2. Import your repository on [Vercel](https://vercel.com/new)
3. Add `GEMINI_API_KEY` environment variable in Vercel dashboard
4. Click Deploy!

**Important:** Never commit your API key to GitHub. Use Vercel's environment variables instead. See [DEPLOYMENT.md](DEPLOYMENT.md) for security best practices.
