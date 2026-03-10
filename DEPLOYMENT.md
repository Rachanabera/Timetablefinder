# 🚀 Deployment Guide: Faculty Timetable System

Your app is now cloud-powered and ready to be shared with the world! Follow these steps to deploy it.

## 1. Push Code to GitHub
If you haven't already, push your code to a GitHub repository:
1. Create a new repo on GitHub.
2. In your terminal:
   ```bash
   git init
   git add .
   git commit -m "feat: cloud-powered timetable system"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

## 2. Deploy to Vercel (Recommended)
Vercel is the easiest place to host Next.js apps for free.
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **"Add New"** > **"Project"**.
3. Import your GitHub repository.
4. **Environment Variables**: This is the most important part! 
   - Expand the **"Environment Variables"** section.
   - Copy every variable from your `.env.local` file and add it here.
   - Example: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, etc.
5. Click **"Deploy"**.

## 3. Configure Firebase Domain (Whitelist)
Once Vercel gives you a URL (e.g., `timetable-finder.vercel.app`):
1. Go to your **Firebase Console**.
2. Go to **Authentication** > **Settings** > **Authorized Domains**.
3. Add your Vercel URL to the list.

## 4. You're Live! 🎉
Anyone can now visit your Vercel URL to search for faculties, rooms, and availability. Updates made via the `/timetable-generator` will reflect for all users instantly.

---
**Note:** If you ever need to clear the database, you can do so directly from the Firebase Console "Data" tab.
