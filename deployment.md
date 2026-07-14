# NOTO Platform - Free Deployment Walkthrough

This guide walks you through deploying the complete NOTO platform (React Frontend + PHP API + PostgreSQL Database) completely for free without any trials or credit cards required.

We will use the following free services:
1. **Neon** - Free serverless PostgreSQL Database
2. **Render** - Free Web Service for Docker (Hosts our Frontend + Backend together)
3. **GitHub** - For version control and connecting to Render

---

## 🚀 Step 1: Create a Free PostgreSQL Database on Neon
Neon provides a generous free tier for PostgreSQL that lasts forever.

1. Go to [neon.tech](https://neon.tech/) and sign up for a free account.
2. Click **Create Project** and name it `noto_db`.
3. Select your preferred region and Postgres version, then click **Create Project**.
4. Once created, you will see a connection string in your dashboard under "Connection Details". It will look like this:
   `postgres://username:password@ep-cold-smoke-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. Note down the individual components from this URL:
   - **DB_HOST**: `ep-cold-smoke-123456.us-east-2.aws.neon.tech`
   - **DB_NAME**: `neondb`
   - **DB_USER**: `username`
   - **DB_PASS**: `password`
   - **DB_PORT**: `5432`

### Seed the Database
1. In the Neon dashboard, navigate to the **SQL Editor** tab on the left sidebar.
2. Open the `schema.sql` file from the root of your NOTO project.
3. Copy all the contents of `schema.sql` and paste them into the Neon SQL Editor.
4. Click **Run** to execute the script. This will create all the required tables and insert the default admin user.

---

## 📦 Step 2: Push Your Code to GitHub
Render connects directly to GitHub to build and deploy your project automatically.

1. Go to [GitHub](https://github.com/) and create a new private repository called `noto`.
2. Open your terminal in the root directory of your project (where `package.json` is located).
3. Run the following commands to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/noto.git
   git push -u origin main
   ```

*(Note: Make sure `.gitignore` includes `node_modules/` and `.env` so they aren't uploaded.)*

---

## 🌐 Step 3: Deploy the Application on Render
We already have a `Dockerfile.prod` configured in the project. This brilliant configuration builds the React frontend and the PHP backend into a *single* Docker container, saving us from having to host them separately!

1. Go to [render.com](https://render.com/) and sign up for a free account.
2. Click **New** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub account.
4. Select the `noto` repository you just created.
5. In the Web Service settings, fill out the following details:
   - **Name**: `noto-app` (or any unique name)
   - **Region**: Choose the one closest to you (or closest to your Neon DB region)
   - **Branch**: `main`
   - **Environment**: Select `Docker`
   - **Instance Type**: **Free** ($0/month)
6. Under **Advanced**, click **Add Environment Variable**. Add the following variables using the details from Neon:
   - `DB_HOST` = *(your neon host string)*
   - `DB_NAME` = *(your neon db name)*
   - `DB_USER` = *(your neon user)*
   - `DB_PASS` = *(your neon password)*
   - `DB_PORT` = `5432`
   - `JWT_SECRET` = *(Generate a random long string for security, e.g., `my-super-secret-production-key`)*
7. Click **Create Web Service**.

---

## ⏳ Step 4: Wait for Build and Launch
Render will now read your `Dockerfile.prod`, build the Vite frontend, install the PHP PostgreSQL extensions, and configure the Apache server. 

This process will take a few minutes. You can monitor the progress in the Render Logs.

Once you see `Your service is live 🎉`, click the URL provided at the top left of the Render dashboard (e.g., `https://noto-app.onrender.com`).

**You're Done!**
Your entire platform is now hosted completely for free. 
- The frontend serves automatically from the root URL.
- The API serves smoothly from `/api/...` on the same domain.
- You can log in using `admin@noto.com` and `password` (or whatever you set the admin password to).

### Important Note about Free Hosting:
Because Render's Free tier sleeps after 15 minutes of inactivity, the very first time someone visits the site after it has been asleep, it may take 30-50 seconds to "wake up." After that, it will be lightning fast.
