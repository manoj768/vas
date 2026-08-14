# Valuation & Site Inspection Studio — Complete Setup & Deployment Guide

A production-grade, full-stack valuation workstation and mobile site inspection platform designed for valuation firms, chartered engineers, banks, NBFCs, and housing finance institutions.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Quick Start (Local PC Development)](#-quick-start-local-pc-development)
3. [Database Setup (Open-Source MongoDB)](#-database-setup-open-source-mongodb)
4. [Public Remote Tunneling (Free Cloudflare / Localtunnel)](#-public-remote-tunneling-free-cloudflare--localtunnel)
5. [Building the Native Android APK (Capacitor)](#-building-the-native-android-apk-capacitor)
6. [Building the Native iOS App (Xcode)](#-building-the-native-ios-app-xcode)
7. [Default Role Accounts & Credentials](#-default-role-accounts--credentials)
8. [Production Deployment & VPS Sizing (1 Lakh Cases/Month)](#-production-deployment--vps-sizing-1-lakh-casesmonth)
9. [Full Whitepaper & Business Architecture Guide](./docs/ARCHITECTURE_AND_BUSINESS_GUIDE.md)

---

## 🏛️ Architecture Overview

The system operates from a single, unified codebase serving three targets:
- **Office Desktop Portal**: Chrome / Edge browser workstation for Admins, Reviewers, and CAD Drafters.
- **Field Inspector Android APK**: Native mobile app with hardware Camera, GPS watermarking, and offline storage.
- **Field Inspector iOS App**: Native iPhone app built with Capacitor and Xcode.
- **Backend API & AI Engine**: Node.js / Express server proxying Gemini 3.6 Flash for document OCR and automated appraisal remarks.
- **Database**: Open-source MongoDB Community Server with Mongoose connection pooling (scalable to 1,00,000+ cases/month).

---

## 💻 Quick Start (Local PC Development)

### 1. Prerequisites
- **Node.js (v18 or v20 LTS)**: [Download Node.js](https://nodejs.org/)
- **Git** (optional): [Download Git](https://git-scm.com/)

### 2. Installation
Extract or clone the project on your PC, open a terminal in the folder, and run:

```bash
# 1. Install all dependencies
npm install

# 2. Start development server
npm run dev
```

The application will be live at: **`http://localhost:3000`**

### 3. Environment Variables (`.env`)
Create a `.env` file in the root folder (or edit the existing one):

```env
PORT=3000
NODE_ENV=development

# (Optional) MongoDB Connection String
# Leave blank for local in-memory fallback, or supply a MongoDB URI:
MONGODB_URI=mongodb://localhost:27017/evalo_valuation
MONGODB_DB_NAME=evalo_valuation

# (Optional) Gemini API Key for AI Auto-Remarks & OCR
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret for Auth Sessions
JWT_SECRET=evalo_production_jwt_secret_2026

# Storage Mode (local saves images to ./uploads/sites/)
STORAGE_DRIVER=local
```

---

## 🗄️ Database Setup (Open-Source MongoDB)

The application includes an **intelligent auto-fallback adapter**:
- **Without MongoDB**: Runs seamlessly using persistent filesystem JSON stores and in-memory caches.
- **With MongoDB**: Automatically activates connection pooling (`minPoolSize: 10`, `maxPoolSize: 50`), compound indexes, and full-text search.

### Option A: Local MongoDB Community Server (Free)
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service.
3. Set `MONGODB_URI=mongodb://localhost:27017/evalo_valuation` in your `.env`.

### Option B: Free Cloud Cluster (MongoDB Atlas)
1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Copy your connection string and set `MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/evalo_valuation` in `.env`.

---

## 🌐 Public Remote Tunneling (Free Cloudflare / Localtunnel)

Expose your local PC server to a secure public HTTPS URL so field engineers can test with real mobile device GPS and Camera sensors:

### Method 1: Cloudflare Quick Tunnel (Recommended — 100% Free, No Limits)
```bash
# Windows / Mac / Linux
npx cloudflared tunnel --url http://localhost:3000
```
*Output: `https://your-random-subdomain.trycloudflare.com` (Share this link with field staff).*

### Method 2: Localtunnel (Instant)
```bash
npx localtunnel --port 3000
```

---

## 📱 Building the Native Android APK (Capacitor)

Convert the web app into a native Android APK with direct access to hardware GPS and camera:

### 1. Prerequisites
- **Android Studio**: [Download Android Studio](https://developer.android.com/studio)
- **Java JDK 17+**

### 2. Generate Android Project & Build APK
```bash
# 1. Add the Android platform (run once)
npx cap add android

# 2. Build the production React bundle
npm run build

# 3. Sync web assets with native Android project
npx cap sync

# 4. Open in Android Studio
npm run cap:android
```

### 3. Inside Android Studio
1. Wait for the Gradle project sync to finish.
2. In the top menu, click **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.
3. Locate the generated `.apk` in `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Install this file on field engineers' Android phones.

---

## 🍎 Building the Native iOS App (Xcode)

### 1. Prerequisites (macOS only)
- **macOS** with **Xcode 15+** installed.
- **Cocoapods**: `brew install cocoapods` or `sudo gem install cocoapods`.

### 2. Build & Launch in Xcode
```bash
# 1. Add the iOS platform (run once)
npx cap add ios

# 2. Build React bundle & sync
npm run build
npx cap sync

# 3. Open in Xcode
npm run cap:ios
```

### 3. Inside Xcode
1. Select your target device or iPhone Simulator.
2. Under **Signing & Capabilities**, assign your Apple Developer Team.
3. Click the **Play / Run** button to test, or click **Product $\rightarrow$ Archive** to publish to Apple TestFlight.

---

## 🔐 Default Role Accounts & Credentials

The platform includes pre-configured demo credentials with role-based access:

| Role | Email | Password | Allowed Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@drrconsultants.in` | `admin123` | Full access: User management, branches, bank formats, approvals. |
| **Reviewer / QA** | `suresh.lucknow@drrconsultants.in` | `reviewer123` | Technical QA, AI remark synthesis, approve/reject survey reports. |
| **CAD Drafter** | `anit.drafter@drrconsultants.in` | `drafter123` | CAD plan drafting, photo matrix organization, Word/Excel compilation. |
| **Site Engineer** | `ratnesh.delhi@drrconsultants.in` | `engineer123` | Mobile site inspection wizard, GPS camera, satellite captures. |

---

## 🐳 Running Locally via Docker & Docker Compose

If you have Docker and Docker Compose installed on your PC, you can spin up the entire application along with **MongoDB (Database)** and **MinIO (S3 Object Storage for 15+ Lakh monthly images)** using a single command—no manual setup required!

### 1. Prerequisites
- **Docker Desktop** installed and running on Windows, macOS, or Linux.

### 2. Run with Docker Compose
Open your terminal in the root project folder and run:

```bash
docker compose up --build -d
```

This will automatically start:
1. **Valuation Studio App Container** at **`http://localhost:3000`**.
2. **MongoDB 7.0 Database Container** for cases, users, and metadata (`port 27017`).
3. **MinIO Object Storage Container** for high-volume GPS inspection photos & satellite captures (`port 9000` API, `port 9001` Management Console).

### 3. Management Commands
- **View logs**: `docker compose logs -f`
- **Stop containers**: `docker compose stop`
- **Tear down completely**: `docker compose down`

---

## 🚀 Production Deployment & VPS Sizing (1 Lakh Cases/Month)

### Hardware Sizing for 1 Lakh Cases / Month:
- **Throughput**: ~3,333 cases/day ($\approx$ 15–20 peak writes/sec).
- **CPU**: 4 to 8 vCPU
- **RAM**: 16 GB (keeps working compound indexes resident in memory).
- **Disk**: 100 GB – 250 GB NVMe SSD.
- **Operating System**: Ubuntu 22.04 / 24.04 LTS.

### Production Run Commands
```bash
# 1. Compile backend & frontend
npm run build

# 2. Launch production daemon (PM2 recommended)
npm run start
# OR with PM2 process manager:
pm2 start dist/server.cjs --name "valuation-studio"
```

---

## 📄 License & Open-Source Details
- Built with **React 18**, **Tailwind CSS**, **Express.js**, **Mongoose / MongoDB Community**, **Capacitor**, and **ExcelJS / Docxtemplater**.
- Fully self-hostable with zero recurring database licensing costs.
