# 🚀 GitHub Actions Automated CI/CD & Hostinger Deployment Guide

This document explains how to connect your private GitHub repository to automate builds, testing, and continuous deployment (CI/CD) to Hostinger.

---

## 1. Overview of the Pipeline

Every time you push code to `main` (or trigger the workflow manually), GitHub Actions runs:

1. **Strict Quality Gates:**
   - Strict TypeScript typechecking (`npm run lint` / `tsc --noEmit`).
   - ZATCA Phase 2 E-Invoicing & Barcode test suite (`tests/invoices.test.ts`).
   - Saudi (+966) Notifications test suite (`tests/notifications.test.ts`).
   - Laravel Backend PHP Syntax verification (`php -l`).
2. **Optimized Production Build:**
   - Compiles Vite bundle into `dist/`.
   - Validates `.htaccess` Apache rules for SPA routing & immutable asset caching.
3. **Automated Hostinger Deployment:**
   - Connects via secure FTP/FTPS.
   - Cleans old remote `/assets/` directory to eliminate stale bundles.
   - Streams fresh distribution files directly to Hostinger's `public_html`.
   - Runs post-deployment live HTTP status check.

---

## 2. Setting Up the Private GitHub Repository

If you haven't linked your local workspace to a private GitHub repository yet, follow these steps:

### Step A: Initialize and Commit Locally
```bash
# Check status
git status

# Stage all files
git add .

# Commit with descriptive message
git commit -m "feat: complete Phase 6 Saudi localization and Phase 7.1 CI/CD deployment"
```

### Step B: Create a Private GitHub Repository
1. Go to [GitHub.com/new](https://github.com/new).
2. Set repository name: `unityteck-multi-store-saas`.
3. Choose **Private** (recommended to keep proprietary e-commerce IP safe).
4. Do not initialize with README, .gitignore, or license (we already have them).
5. Click **Create repository**.

### Step C: Link Local Git to Remote
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/unityteck-multi-store-saas.git
git branch -M main
git push -u origin main
```

---

## 3. Configuring GitHub Repository Secrets

To allow GitHub Actions to deploy to your Hostinger server without hardcoding credentials in code, add the following secrets in GitHub:

1. In your GitHub repository, click **Settings** (top navigation bar).
2. On the left sidebar, expand **Secrets and variables** and click **Actions**.
3. Click **New repository secret** for each of the following:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `HOSTINGER_FTP_HOST` | Hostinger FTP hostname or server IP | `ftp.giftshop-sa.com` or `145.223.x.x` |
| `HOSTINGER_FTP_USER` | Hostinger FTP account username | `u920689430.giftshop` |
| `HOSTINGER_FTP_PASSWORD`| Hostinger FTP account password | *(Your secure password)* |
| `HOSTINGER_FTP_REMOTE_DIR` | Directory path on Hostinger | `public_html` |
| `TARGET_URL` | Live storefront URL | `https://giftshop-sa.com/` |

> 💡 **Where to find Hostinger FTP details:**
> 1. Log into your **Hostinger hPanel**.
> 2. Navigate to **Websites** → Select your domain → **FTP Accounts**.
> 3. Copy the **FTP Host**, **FTP Username**, and create/reset the **Password**.

---

## 4. Manual Deployment Trigger (`workflow_dispatch`)

You can trigger a deployment on demand without pushing new code:

1. Go to the **Actions** tab in your GitHub repository.
2. Select **Production CI/CD Pipeline & Hostinger Deploy** from the left workflow list.
3. Click the **Run workflow** dropdown button.
4. Select the `main` branch and click **Run workflow**.

---

## 5. Security & Isolation Protection (Zero Leak Policy)

- The root [`.gitignore`](file:///E:/unityteck-_-multi-store-e-commerce-saas/.gitignore) strictly ignores:
  - All `.env` and `.env.*` files.
  - SSH private keys (`*.pem`, `*.key`).
  - Database dumps (`*.sql.gz`, `backups/`).
  - Build artifacts and temporary caches.
- No database credentials, API tokens, or server passwords will ever be tracked by Git or exposed in public commits.
