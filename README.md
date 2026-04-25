---
title: EquiLens - AI Bias Detector
emoji: 🔍
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 5.25.0
app_file: app.py
pinned: true
license: apache-2.0
---

<div align="center">

# 🔍 EquiLens
### AI Bias & Fairness Auditor — Powered by Gemini 2.0

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-purple?logo=google)](https://aistudio.google.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green)](LICENSE)

**Upload any decision dataset. Gemini AI detects hidden discrimination, quantifies who is harmed, and prescribes exactly how to fix it.**

[🚀 Live Demo](https://equilens.vercel.app) · [📋 Problem Statement](#problem) · [🛠️ Tech Stack](#tech)

</div>

---

## 🚨 The Problem

AI systems make **life-changing decisions** about who gets a job, a loan, or medical care. When trained on historically biased data, these systems silently amplify discrimination at scale — and the people harmed never know why they were rejected.

**EquiLens is the mirror that AI systems never had.**

---

## ✨ What EquiLens Does

| Feature | Description |
|---|---|
| 📂 **CSV Upload** | Drag & drop any binary decision dataset |
| 📊 **Statistical Metrics** | Disparity ratio, demographic parity gap, 80% Rule check per attribute |
| 🤖 **Gemini AI Audit** | Deep analysis: root cause, affected groups, legal risk, remediation plan |
| ⚠️ **Ethical Flagging** | Auto-flags datasets that violate legal fairness standards |
| 🔧 **Fix Plan** | 5 specific, actionable recommendations from Gemini |
| 📈 **Visual Dashboard** | Bar charts per protected attribute with group-level breakdowns |

---

## 🛠️ Tech Stack <a name="tech"></a>

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **AI Engine** | Gemini 2.0 Flash (Google AI Studio) |
| **Charts** | Recharts |
| **CSV Parsing** | PapaParse |
| **Hosting** | Vercel / Firebase |
| **API** | Next.js Edge API Routes |

---

## 🗂️ Project Structure

```
equilens/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts       ← Gemini API + fairness metrics
│   ├── globals.css            ← Global styles + animations
│   ├── layout.tsx             ← Root layout + metadata
│   └── page.tsx               ← Full UI (upload → analyze → results)
├── public/                    ← Static assets
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/cbrethick/EquiLens
cd EquiLens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel --prod
```

---

## 🧪 Try It

1. Click **"Load sample loan dataset"**
2. Hit **"Run Full Bias Audit with Gemini AI"**
3. See the bias score, disparity charts, and Gemini's full analysis

---

## 📐 How It Wins (Judging Criteria)

| Criterion | Score | How EquiLens addresses it |
|---|---|---|
| **Technical Merit (40%)** | ⭐⭐⭐⭐⭐ | Next.js Edge API, TypeScript, statistical fairness metrics, Gemini 2.0 Flash |
| **Innovation (25%)** | ⭐⭐⭐⭐⭐ | AI auditing AI — recursive fairness inspection is a novel framing |
| **Alignment With Cause (25%)** | ⭐⭐⭐⭐⭐ | Directly targets job/loan/medical discrimination affecting millions |
| **UX (10%)** | ⭐⭐⭐⭐⭐ | Drag-drop → instant visual dashboard, zero friction |

---

## 👨‍💻 Author

**Rethick CB** — Google Solution Challenge 2026 · Build with AI Track

---

## 📄 License

Apache 2.0
