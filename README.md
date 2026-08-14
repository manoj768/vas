# Valuation & Site Inspection Studio — Complete Setup & Industrial Deployment Guide

A production-grade, full-stack valuation workstation, document manager, and mobile site inspection platform designed for valuation firms, chartered engineers, banks, NBFCs, and housing finance institutions.

---

## 📑 Table of Contents
1. [🏁 Step-by-Step Beginner-to-Production Quickstart (From Git Clone to Live App)](#-step-by-step-beginner-to-production-quickstart)
2. [🏛️ Architecture & System Topology](#-architecture--system-topology)
3. [🏢 Industrial Deployment Methods Comparison (Local Docker vs 1-Click BAT vs Standalone EXE vs Cloud VPS)](#-industrial-deployment-methods-comparison)
4. [🪟 1-Click Windows Launchers & Standalone Executable (.EXE)](#-1-click-windows-launchers--standalone-executable-exe)
5. [🗂️ Per-Case Document & Deed Storage Architecture](#-per-case-document--deed-storage-architecture)
6. [🌐 Remote Tunneling for Global Mobile & WFH Access (Free Cloudflare)](#-remote-tunneling-for-global-mobile--wfh-access-free-cloudflare)
7. [📱 Mobile App Generation (Android APK & iOS)](#-mobile-app-generation-android-apk--ios)
8. [🧪 Comprehensive Testing Guide (Web, Mobile, Database & Storage)](#-comprehensive-testing-guide)
9. [🔄 Git-Based Update Workflow & Dev-to-Prod Pipeline](#-git-based-update-workflow--dev-to-prod-pipeline)
10. [🔐 Default Role Accounts & Credentials](#-default-role-accounts--credentials)
11. [☁️ Cloud VPS Production Sizing (1 Lakh Cases / Month)](#-cloud-vps-production-sizing-1-lakh-cases--month)
12. [Full Whitepaper & Business Architecture Guide](./docs/ARCHITECTURE_AND_BUSINESS_GUIDE.md)

---

## 🏁 Step-by-Step Beginner-to-Production Quickstart

Follow these exact steps from cloning the Git repository to final testing and deployment.

### Step 1: Clone the Git Repository
Open your terminal (Git Bash, Command Prompt, PowerShell, or Linux/macOS Terminal) and run:
```bash
# 1. Clone your repository
git clone https://github.com/YOUR_ORGANIZATION/valuation-studio.git

# 2. Enter the project directory
cd valuation-studio
```

---

### Step 2: Choose Your Execution Way

You can run Valuation Studio using any of the **3 supported ways**:

#### 🌟 Way A: 1-Click Windows Desktop (Easiest for Office PC)
If you are on Windows and have Docker Desktop installed:
1. Double-click **`START_VALUATION_STUDIO.bat`**.
2. It automatically starts MongoDB, MinIO Image Storage, and the Node Web App.
3. It automatically opens your browser at **`http://localhost:3000`**.

#### 🐳 Way B: Standard Docker Compose (Recommended for Servers & Linux/Mac)
```bash
# Start all services in the background (App, MongoDB 7.0, MinIO S3)
docker compose up --build -d

# Check running status
docker compose ps

# View live streaming logs
docker compose logs -f app
```
- Web Application: **`http://localhost:3000`**
- MinIO Storage Console: **`http://localhost:9001`** (Login: `minioadmin` / `minioadmin`)
- MongoDB Database: **`mongodb://localhost:27017`**

#### 💻 Way C: Native Node.js Developer Mode (For Quick Local Tweaks)
```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

### Step 3: Connect Field Engineers via Free Public Tunnel

To allow Android phones in the field (on 4G/5G) and remote staff at home to access your Office Server PC:

```bash
# Run this on your Server PC
npx cloudflared tunnel --url http://localhost:3000
```
Cloudflare will output a public HTTPS address (e.g., `https://rapid-valuation-demo.trycloudflare.com`).
Share this link with your field engineers or configure it into the Android APK.

---

### Step 4: Generate the Android APK for Site Inspectors

1. Open `capacitor.config.ts` and set your tunnel or server URL:
   ```typescript
   const BACKEND_PLACEHOLDER_URL = "https://your-tunnel-subdomain.trycloudflare.com";
   ```
2. Build and sync web assets with the Android native project:
   ```bash
   npm run build
   npx cap sync
   npm run cap:android
   ```
3. In Android Studio: Click **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.
4. Distribute `android/app/build/outputs/apk/debug/app-debug.apk` to site inspectors.

---

## 🏛️ Architecture & System Topology

The system operates from a single, unified codebase serving three targets:
- **Office Desktop Portal**: Chrome / Edge browser workstation for Admins, Reviewers, and CAD Drafters.
- **Field Inspector Android APK**: Native mobile app with hardware Camera, GPS watermarking, and offline storage.
- **Field Inspector iOS App**: Native iPhone app built with Capacitor and Xcode.
- **Backend API & AI Engine**: Node.js / Express server proxying Gemini 3.6 Flash for document OCR and automated appraisal remarks.
- **Database Layer**: MongoDB 7.0 Community Server with connection pooling (`minPoolSize: 10`, `maxPoolSize: 50`) and compound indexes.
- **Object Storage Layer**: MinIO (S3-Compatible) dedicated container handling 15+ Lakh monthly GPS photos and high-resolution deeds.

```
                       ┌────────────────────────────────────────────────────────┐
                       │               YOUR OFFICE SERVER PC (Local)            │
                       │                                                        │
                       │  [ START_VALUATION_STUDIO.bat ]                        │
                       │      ├── App Web & API Server (:3000)                  │
                       │      ├── MongoDB 7.0 Database (:27017)                 │
                       │      └── MinIO S3 Image Storage (:9000 & :9001)        │
                       │                                                        │
                       │  [ Cloudflare Tunnel / Ngrok ]                         │
                       │      └── Gives: https://your-office.trycloudflare.com  │
                       └────────────────────────────────────────────────────────┘
                                                    ▲
                                                    │ (Secure Remote HTTPS Tunnel)
                   ┌────────────────────────────────┼───────────────────────────────┐
                   │                                │                               │
                   ▼                                ▼                               ▼
    📱 Android Phones (Field)          💻 Office Staff Laptops              🏠 Work from Home Staff
    Site Engineers submit GPS          Reviewers & Drafters in            Admins checking MIS reports
    photos & measurements live         the office working on CAD          from home or branches
```

---

## 🏢 Industrial Deployment Methods Comparison

| Deployment Method | Best For | Prerequisites | Pros | Cons |
| :--- | :--- | :--- | :--- | :--- |
| **🐳 Docker Compose (`docker compose up -d`)** | **Office Server PC / Production VPS** | Docker Desktop / Docker Engine | All-in-one stack (App + MongoDB + MinIO), auto-restarts on reboot, zero data loss updates via Git. | Requires Docker installed. |
| **🪟 1-Click BAT (`START_VALUATION_STUDIO.bat`)** | **Non-technical Office Staff on Windows** | Windows 10/11 + Docker | 1-click startup, auto-opens Chrome/Edge browser, auto-fallback to Node.js. | Windows only. |
| **📦 Standalone EXE (`ValuationStudio.exe`)** | **Single PC offline demo / portable testing** | Node.js (to compile) | Single executable file, no Docker required. | Must start MongoDB separately for large scale. |
| **☁️ Cloud VPS (Ubuntu + Docker / PM2)** | **Large Distributed Firm (20+ Branches)** | Linux Cloud VPS (Hetzner / AWS / DigitalOcean) | 99.99% uptime, static domain name, multi-branch scaling. | Monthly server subscription. |

---

## 🪟 1-Click Windows Launchers & Standalone Executable (.EXE)

Ready-to-use batch scripts and executable builders are included in the root folder so you never need to type terminal commands:

| Launcher Script | What It Does |
| :--- | :--- |
| **`START_VALUATION_STUDIO.bat`** | **Double-click to start.** Auto-detects Docker Desktop, launches the full stack (App + MongoDB + MinIO), and opens your browser automatically to `http://localhost:3000`. |
| **`STOP_VALUATION_STUDIO.bat`** | **Double-click to stop.** Gracefully stops all background containers and preserves 100% database integrity. |
| **`BUILD_WINDOWS_EXE.bat`** | **Double-click to compile.** Packages the entire full-stack app into a standalone Windows 64-bit binary at `dist\ValuationStudio.exe`. |

---

## 🗂️ Per-Case Document & Deed Storage Architecture

All property documents, deeds, sanctioned maps, and physical site inspection photos are segregated on an **isolated, per-case basis**.

```text
/uploads/cases/{caseId}/
  ├── 📄 deeds/
  │     ├── title_deed_registered.pdf
  │     ├── sale_deed_mother_copy.pdf
  │     ├── property_tax_receipt.pdf
  │     └── electricity_meter_bill.jpg
  │
  ├── 📐 sanctioned_plans/
  │     ├── authority_sanction_map.pdf
  │     ├── layout_plan_blueprint.png
  │     └── cad_drafter_drawing.dwg
  │
  ├── 📸 site_inspection_photos/
  │     ├── front_elevation_gps_watermarked.jpg
  │     ├── road_width_approach_18ft.jpg
  │     ├── interior_hall_flooring.jpg
  │     ├── kitchen_amenities.jpg
  │     └── electricity_meter_box.jpg
  │
  ├── 🛰️ geospatial/
  │     ├── esri_satellite_boundary_capture.png
  │     └── openstreetmap_surroundings.png
  │
  └── 📑 generated_reports/
        ├── SBI_Valuation_Report_Final.docx
        ├── HDFC_Rate_Derivation_Sheet.xlsx
        └── Photo_Annexure_Matrix.pdf
```

### Storage Offloading Matrix:
- **MongoDB**: Stores case metadata, workflow state, timestamps, GPS coordinates, and file path URIs (sub-10ms queries).
- **MinIO / Disk**: Stores heavy binary files (PDFs, high-res photos, DWG plans), completely preventing database RAM bloat.

---

## 🌐 Remote Tunneling for Global Mobile & WFH Access (Free Cloudflare)

To allow Android phones in the field and remote reviewers to connect to your Office Server PC:

```bash
# Start a free, unlimited Cloudflare Tunnel
npx cloudflared tunnel --url http://localhost:3000
```
- **Tunnel Output**: `https://your-custom-subdomain.trycloudflare.com`
- **Security**: All traffic is encrypted over HTTPS with DDoS protection.

---

## 📱 Mobile App Generation (Android APK & iOS)

### 1. Configure Backend URL in `capacitor.config.ts`
Open `capacitor.config.ts` and set your Server PC's tunnel URL:
```typescript
// capacitor.config.ts
const BACKEND_PLACEHOLDER_URL = "https://your-tunnel-name.trycloudflare.com"; // OR "http://192.168.1.100:3000"
```

### 2. Build the Android APK in 3 Steps
```bash
# 1. Build web bundle & sync with Android
npm run build
npx cap sync

# 2. Open Android Studio
npm run cap:android
```
3. Inside Android Studio: Click **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.
4. Locate the generated `.apk` in `android/app/build/outputs/apk/debug/app-debug.apk` and install it on engineers' phones.

---

## 🧪 Comprehensive Testing Guide

Follow this checklist to test every module before putting the system into active production:

### 1. Web Portal & Authentication Test
1. Open `http://localhost:3000` in Chrome/Edge.
2. Log in using each role credential (Admin, Reviewer, Drafter, Engineer).
3. Verify the role-specific dashboard navigation and permission gates.

### 2. Bank Valuation Workstation Test
1. Click **"+ New Valuation Case"**.
2. Select **State Bank of India (SBI)** or **HDFC Bank** template.
3. Fill in property land area, built-up rate, and depreciation.
4. Verify real-time fair market value, guideline value, and distress realization calculations.
5. Generate the official Word (`.docx`) and Excel (`.xlsx`) appraisal reports.

### 3. CAD Drafting & Satellite GIS Test
1. In any case, open the **CAD & Floor Plan Drafter** tab.
2. Draw property boundary polygons, add dimension annotations (ft/m), and export CAD canvas.
3. Open the **Satellite Map & GIS** tab, search a landmark, and capture the GPS boundary polygon.

### 4. Android Mobile Inspection Test
1. On an Android phone, launch the app or open the tunnel URL.
2. Log in as Site Engineer (`ratnesh.delhi@drrconsultants.in`).
3. Take a site photo using the camera.
4. Verify that real-time **GPS Coordinates (Latitude/Longitude), Compass Bearing, and Date-Time Stamp** are watermarked on the photo.
5. Toggle Airplane Mode, save an inspection draft offline, re-enable internet, and verify automatic cloud sync.

### 5. Storage & Database Persistence Test
1. Upload a property deed PDF and 4 site inspection photos.
2. Check the MinIO console at `http://localhost:9001` to confirm files are stored in bucket `valuation-photos`.
3. Restart the Docker container (`docker compose restart`).
4. Re-open the case in your browser and confirm all deeds, images, and calculations remain intact.

---

## 🔄 Git-Based Update Workflow & Dev-to-Prod Pipeline

### Updating Running Containers via Git
When you make updates in Git, redeploy your running server in 1 single command:

```bash
git pull origin main && docker compose up --build -d
```
*Note: Your MongoDB database and uploaded files remain 100% safe and intact across rebuilds because they live in persistent named volumes.*

### Branching Strategy (Dev $\rightarrow$ Testing $\rightarrow$ Main/Prod)
1. **`main` Branch**: Stable live production instance (Runs on Port `3000`).
2. **`dev` Branch**: Active development & sandbox QA testing (Runs on Port `3001` via `docker-compose.dev.yml`).

```bash
# To deploy Dev testing environment:
chmod +x deploy.sh
./deploy.sh dev

# To deploy Live Production environment:
./deploy.sh prod
```

---

## 🔐 Default Role Accounts & Credentials

| Role | Email | Password | Primary Workflow Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@drrconsultants.in` | `admin123` | Full access: User management, branches, bank formats, approvals. |
| **Reviewer / QA** | `suresh.lucknow@drrconsultants.in` | `reviewer123` | Technical QA, AI remark synthesis, approve/reject survey reports. |
| **CAD Drafter** | `anit.drafter@drrconsultants.in` | `drafter123` | CAD plan drafting, photo matrix organization, Word/Excel compilation. |
| **Site Engineer** | `ratnesh.delhi@drrconsultants.in` | `engineer123` | Mobile site inspection wizard, GPS camera, satellite captures. |

---

## ☁️ Cloud VPS Production Sizing (1 Lakh Cases / Month)

If you decide to host on a public Cloud VPS (Hetzner, DigitalOcean, AWS EC2, Contabo):

- **Throughput**: ~3,333 cases/day ($\approx$ 15–20 peak writes/sec).
- **Recommended Sizing**: 4 to 8 vCPU, 16 GB RAM, 150 GB+ NVMe SSD.
- **Operating System**: Ubuntu 22.04 / 24.04 LTS.
- **Process Manager**: Docker Compose or `pm2 start dist/server.cjs --name "valuation-studio"`.

---

## 📄 License & Technical Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Canvas CAD Engine, Leaflet/MapLibre GIS.
- **Backend**: Node.js, Express, Mongoose, @aws-sdk/client-s3, ExcelJS, Docxtemplater.
- **Mobile**: Capacitor 6 (Android & iOS).
- **Database & Storage**: MongoDB 7.0 Community & MinIO S3 Object Storage (100% Free & Open-Source).
