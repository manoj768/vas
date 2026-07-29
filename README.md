# Valuation Workstation & Bank Empanelment Platform

A full-stack enterprise valuation workstation for bank empanelment, real estate property surveys, technical report generation, and automated bank format export (.docx / .xlsx).

---

## 💻 Office PC On-Premise Host Server & Public Access Setup

Host all valuation records, site images, bank templates, and backend logic locally on your office desktop PC with zero cloud hosting cost.

### 1. Install Node.js on your Office PC
- Download and install **Node.js LTS (v20 or higher)** from [nodejs.org](https://nodejs.org/) onto your Office Windows PC or Mac.

### 2. Start the Server in One Command
Open Command Prompt or Terminal on your Office PC inside the cloned repository directory and run:

```bash
npm install && npm start
```

This boots the valuation server on **port 3000**, handling case files, site photo attachments, bank templates, and dynamic report exports.

---

## 🌐 Local & Remote Access URLs

### 1. Office Local LAN Access URL (Wi-Fi / LAN)
Access the workstation from any PC or tablet connected to your office Wi-Fi network:

```
http://<YOUR_OFFICE_PC_IP>:3000
```
*(Example: `http://192.168.1.100:3000`)*

> **Use Case:** For Drafters, Valuers, and Reviewers inside the main office.

### 2. Free Remote Mobile Field URL (Cloudflare Tunnel)
To allow Field Engineers to upload property photos and submit survey reports from mobile phones anywhere outside the office without paying for a static IP or domain:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

This outputs a free, secure HTTPS URL (e.g., `https://drr-valuation-office.trycloudflare.com` or a random Cloudflare subdomain).

> **Use Case:** Share this HTTPS URL with Field Inspectors on mobile devices to perform site visits and GPS-tagged property surveys from anywhere.

---

## 🗄️ Central Valuation Database & System Infrastructure

### 1. Valuation Data Management
- **Centralized Case Repository**: Unified storage for all valuation cases, property boundaries, market valuation rates, and inspector assignments.
- **Geotagged Media Isolation**: Stores complete inspection logs and geotagged photographs securely on local persistent disk (`/uploads/`).
- **Branch & Region Security**: Multi-region branch isolation for secure team data partitioning.
- **Offline Field Sync**: Automatic client state syncing for field inspectors operating in poor cellular connectivity areas.

### 2. Bank Report Generation Engine
- **Custom Template Compilation**: Automated document compilation engine matching exact bank Word (`.docx`) and Excel (`.xlsx`) formats.
- **Dynamic Photo Tagging Grid**: Automatic Row x Column matrix layout for property site photos according to bank specification.
- **Structured Accommodation & Boundaries**: Automated table insertion for floor accommodations, construction schedules, and boundary measurements.
- **Multi-Format Export**: Instant export of reports in PDF, DOCX, and XLSX formats.

---

## 🏗️ System Features & Workflows

1. **Valuation Pipeline Dashboard** – Live tracking of initiated cases, field surveys, draft reviews, and completed valuation certificates.
2. **Bank Empanelment Directory** – Central directory for onboarded banks & financial institutions with LTV benchmarks and custom report templates.
3. **Site Survey & GPS Camera** – Mobile-optimized site inspection wizard with mandatory photo tagging, GPS coordinates, and satellite location verification.
4. **Report Generator Studio** – Automatic generation of valuation reports matching exact bank formats (.docx and .xlsx).
5. **Role-Based Access Control** – Role management for Admin, Field Engineer, Drafter, and Quality Reviewer.
