# 🔍 EquiLens — AI Bias & Fairness Auditor

<div align="center">

![EquiLens Banner](https://img.shields.io/badge/EquiLens-AI%20Bias%20Detector-00d4aa?style=for-the-badge&logo=google&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-8B5CF6?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-22c55e?style=flat-square)](LICENSE)
[![Google Solution Challenge](https://img.shields.io/badge/Google-Solution%20Challenge%202026-EA4335?style=flat-square&logo=google&logoColor=white)](https://hack2skill.com)

<br/>

> **Upload any decision dataset. Gemini AI surfaces hidden discrimination,**
> **quantifies who is harmed, and prescribes exactly how to fix it.**

<br/>

[🚀 Live Demo](https://equilens.vercel.app) &nbsp;·&nbsp;
[📂 GitHub](https://github.com/cbrethick/EquiLens) &nbsp;·&nbsp;
[📋 Problem Statement](#-the-problem) &nbsp;·&nbsp;
[🛠️ Tech Stack](#️-tech-stack) &nbsp;·&nbsp;
[👥 Team](#-team)

<br/>

</div>

---

## 🚨 The Problem

Every day, AI systems make **life-changing decisions** — who gets hired, who receives a loan, who qualifies for medical care. These systems learn from historical data that carries decades of human bias. The result: **discrimination gets automated and scaled** to millions of people.

The people harmed **never know why** they were rejected.
The organizations deploying these systems **often don't know** the bias exists.

**EquiLens is the mirror that AI systems never had.**

---

## 💡 What EquiLens Does

```
 User uploads CSV dataset
          │
          ▼
 EquiLens computes fairness metrics
 (Disparity ratio · Demographic parity gap · 80% Rule)
          │
          ▼
 Metrics + data context → Gemini 2.0 Flash
          │
          ▼
 Gemini returns: Bias score · Risk level · Root cause
 Affected groups · Legal risk · 5 fix recommendations
          │
          ▼
 Interactive dashboard with charts + audit report
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📂 **Drag & Drop CSV Upload** | Any binary decision dataset — hiring, loans, medical, admissions |
| 📊 **Statistical Fairness Metrics** | Disparity ratio, demographic parity gap, 80% Rule per attribute |
| 🤖 **Gemini 2.0 Flash Audit** | Deep AI analysis: root cause, affected groups, legal risk |
| ⚠️ **Ethical Flagging** | Auto-flags datasets violating US EEOC legal fairness standards |
| 🔧 **5-Point Fix Plan** | Specific, actionable remediation steps from Gemini |
| 📈 **Visual Dashboard** | Bar charts per protected attribute with group-level breakdowns |
| 🗂️ **4-Tab Results View** | Overview · Per Attribute · AI Analysis · Fix Plan |
| 🔒 **Privacy First** | API key stays in your browser. No data stored anywhere. |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript 5 | Type-safe development |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **AI Engine** | Gemini 2.0 Flash | Bias analysis & recommendations |
| **Charts** | Recharts | Interactive data visualization |
| **CSV Parsing** | PapaParse | Client-side CSV processing |
| **API** | Next.js Edge Runtime | Fast serverless API routes |
| **Hosting** | Vercel | Production deployment |

---

## 🗂️ Project Structure

```
EquiLens/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts        ← Gemini API + fairness metrics engine
│   ├── globals.css             ← Dark theme + custom animations
│   ├── layout.tsx              ← Root layout + SEO metadata
│   └── page.tsx                ← Full UI (upload → analyze → dashboard)
├── public/                     ← Static assets
├── next.config.js              ← Next.js configuration
├── tailwind.config.js          ← Design tokens
├── tsconfig.json               ← TypeScript config
├── postcss.config.js           ← PostCSS config
└── package.json                ← Dependencies
```

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/cbrethick/EquiLens.git
cd EquiLens

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **http://localhost:3000** — you're live!

> **Note:** You'll need a free Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## 🧪 Try the Demo

1. Click **"⚡ Load sample loan dataset"**
2. Hit **"Run Full Bias Audit with Gemini AI"**
3. Watch Gemini detect gender & racial bias in real-time
4. Explore the 4 result tabs — Overview, Metrics, AI Analysis, Fix Plan

---

## 📐 How EquiLens Wins (Judging Criteria)

| Criterion | Weight | How EquiLens addresses it |
|---|---|---|
| **Technical Merit** | 40% | Next.js 14 Edge API · TypeScript · Statistical fairness engine · Gemini 2.0 Flash integration |
| **Innovation & Creativity** | 25% | Using AI to audit AI — recursive fairness inspection is a genuinely novel approach |
| **Alignment With Cause** | 25% | Directly targets job, loan & medical discrimination affecting millions of real people |
| **User Experience** | 10% | Drag-drop upload → 3-second Gemini analysis → beautiful visual dashboard |

---

## 📊 Fairness Standards Applied

| Standard | Description |
|---|---|
| **80% Rule (US EEOC)** | If one group's approval rate < 80% of the highest group → disparate impact |
| **Demographic Parity** | All groups should have equal approval rates |
| **Disparity Ratio** | Ratio of lowest to highest group approval rate (target: > 0.8) |
| **Disparity Gap** | Percentage point difference between best and worst group |

---

## 👥 Team

<div align="center">

| | Name | Role |
|---|---|---|
| 👨‍💻 | **Rethick** | Lead Developer · AI Integration · Frontend |
| 👩‍💻 | **Nakshatra** | UI/UX Design · Research · Testing |
| 👩‍💻 | **Ashwitha** | Data Analysis · Problem Statement · Presentation |

**Built for Google Solution Challenge 2026 — Build with AI Track**

</div>

---

## 🔮 Future Roadmap

- [ ] Support for multiple fairness metrics (Equalized Odds, Calibration)
- [ ] PDF audit report export
- [ ] Model file upload (`.pkl`, `.h5`) for direct model inspection
- [ ] Historical bias tracking dashboard
- [ ] API endpoint for CI/CD integration

---

## 📄 License

Apache 2.0 — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ by **Team EquiLens** — Rethick · Nakshatra · Ashwitha

*"AI should work for everyone — not just the majority."*

</div>
