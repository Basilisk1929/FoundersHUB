# FoundersHub — Delivery is the Currency 🚀

> **A three-sided startup platform where Founders execute 8-department sprints, Developers earn dynamic equity by shipping code, and Investors fund proven delivery.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Ready-000000?style=for-the-badge&logo=vercel)](https://turbo.build/pack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

In the modern startup ecosystem, ideas are abundant, but verified execution is rare. **FoundersHub** replaces speculative pitch decks with an accountability engine built on:
1. **Founders**: Validate venture concepts through the Readiness Gate, orchestrate 14–30 day execution sprints across 8 modular departments, manage team rosters, and pitch media assets.
2. **Developers**: Claim backlog deliverables, ship verified commits, build a **GitHub & CodeChef styled builder profile**, and earn dynamically vested startup equity.
3. **Investors**: Syndicate capital into ventures that have proven traction, verifiable milestones, and audited execution scores.

---

## ⚡ Key Features

### 💻 1. Developer Profile System (GitHub & CodeChef Style)
- **Profile Hero & Identifiers**: Real-time sprint availability badge (`Open to Sprints`), customizable headline, location with local time, pronouns, and handles.
- **CodeChef Rating Banner**: ⭐⭐⭐⭐⭐ 5-Star Builder rating with Elo score (2184+), Division 1 status, global & country rankings, and problem difficulty breakdowns.
- **GitHub Contribution Matrix (Heatmap)**: 52-week green activity grid simulating daily commit and sprint velocity with tooltips and streak statistics.
- **Pinned Past Projects**: Repository cards with language color dots, star and fork counters, live demo links, and GitHub source links.
- **Interactive Résumé & Portfolio Vault**: Embedded document preview modal, one-click PDF download, and drag-and-drop résumé upload.

### 🤖 2. Context-Grounded AI Department Mentor & SOP Vault
- **Deep Context Ingestion**: Grounded in the venture's actual `problemStatement`, `description`, `validationEvidence`, sector tags, active sprints, and existing deliverables.
- **Sprint Task Generator**: Streams structured task suggestions that can be added to the department Kanban backlog with 1 click (**➕ Add to Kanban**).
- **Standard Operating Procedure (SOP) Vault**: Generates formal markdown execution SOPs and saves them directly to the department's knowledge vault (**💾 Save SOP to Vault**).

### 👥 3. 8-Department Architecture & Cross-Department Transfers
- **8 Modular Workspaces**: Development, Marketing, Design (UI/UX), Product, Sales, Customer Support, Operations, and Finance.
- **Team Roster Management**: Founders can view assigned builders and dynamically reassign members across departments with atomic state synchronization and timeline audit logs.
- **Strict Role Isolation**: The navigation column strictly isolates views:
  - **Developer**: Developer Suite + Platform & Explore
  - **Founder**: Founder Suite + Platform & Explore
  - **Investor**: Investor Suite + Platform & Explore

### 💰 4. Execution Gating & Investor Dealroom
- **Readiness Gate & SHA-256 Snapshotting**: Ventures submit verification proof and generate immutable ownership hashes before launching active sprints.
- **Gated Funding**: Capital commitments are restricted to startups with completed sprints and verified execution scores.
- **Integrated Payments & Treasury**: Razorpay test-mode checkout with automated 1% platform fee calculation and escrow verification.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: Vanilla CSS & [TailwindCSS](https://tailwindcss.com/) with custom dark glassmorphic design tokens
- **Icons & Micro-animations**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)
- **Database & Storage**: [MongoDB](https://www.mongodb.com/) with transparent fallback to local JSON persistent memory store (`.data/db.json`)
- **AI Engine**: Google Gemini API integration with streaming support

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Basilisk1929/FoundersHUB.git
cd FoundersHUB
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your API keys (optional for local memory mode):
```bash
cp .env.example .env.local
```

Key environment variables:
```env
# Database (MongoDB connection string, or leave blank to use built-in local store)
MONGODB_URI=mongodb+srv://...

# AI Mentor & Copilot (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Payments (Razorpay Test Mode)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

The platform comes pre-seeded with test accounts for each persona:

| Persona | Email | Password | Access / Suite |
| :--- | :--- | :--- | :--- |
| **Founder** | `founder@founderhub.com` | `Password123!` | Command Center, 8-Dept Tools, Rosters, AI Copilot |
| **Developer** | `developer@founderhub.com` | `Password123!` | Dev Workspace, GitHub/CodeChef Profile, Backlog, Equity |
| **Investor** | `investor@founderhub.com` | `Password123!` | Investor Dealroom, Verified Ventures, Escrow Strip |

---

## 📁 Repository Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/            # AI mentor, copilot, SOP, and sprint planner routes
│   │   ├── auth/          # Authentication, sessions, login, signup, profile
│   │   ├── departments/   # Department workspace endpoints & member transfers
│   │   ├── developer/     # Developer profile, projects, and résumé API
│   │   ├── funding/       # Investor dealroom & Razorpay order/verify endpoints
│   │   ├── startups/      # Startup venture CRUD & readiness gate
│   │   └── tasks/         # Kanban deliverable creation and status updates
│   ├── dashboard/
│   │   ├── developer/     # Developer sprint workspace & profile tab
│   │   ├── founder/       # Founder command center & department rosters
│   │   └── investor/      # Investor dealroom & venture commitments
│   ├── departments/       # Interactive 8-department project workspaces
│   ├── discover/          # Public discovery & venture directory
│   └── layout.tsx         # Root layout with responsive shell & navigation
├── components/
│   ├── developer/         # DeveloperProfileView & repository cards
│   ├── layout/            # CollapsibleSidebar & AppShell
│   ├── media/             # PitchMediaViewer (YouTube & presentation decks)
│   └── ui/                # Glassmorphic UI primitives (Button, Badge, Cards)
├── lib/
│   ├── auth/              # JWT, session cookies, and RBAC authorization
│   ├── db/                # MongoDB client, seed data, and local store
│   └── gemini.ts          # Google Gemini AI streaming integration
└── types/                 # TypeScript data contracts and document schemas
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
