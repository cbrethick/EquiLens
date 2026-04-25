'use client'

import { useState, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell
} from 'recharts'
import {
  Upload, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, Zap, Shield, Eye, TrendingUp,
  FileText, Github, ExternalLink, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AttributeMetric {
  approval_rates: Record<string, number>
  disparity_ratio: number
  disparity_gap: number
  biased: boolean
  max_group: string
  min_group: string
}

interface AIReport {
  overall_bias_score: number
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  bias_summary: string
  most_biased_attribute: string
  affected_groups: string[]
  advantaged_groups: string[]
  recommended_fixes: string[]
  ethical_flag: boolean
  flag_reason: string
  detailed_findings: string
  fairness_violations: string[]
  business_risk: string
  positive_findings: string
}

interface AnalysisResult {
  metrics: Record<string, AttributeMetric>
  aiReport: AIReport
  totalRows: number
}

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_CSV = `age,gender,race,education,years_experience,loan_amount,approved
34,Male,White,Bachelor,8,15000,1
28,Female,Black,Bachelor,3,12000,0
45,Male,White,Master,20,50000,1
23,Female,Hispanic,High School,1,8000,0
38,Male,Asian,Bachelor,12,25000,1
29,Female,White,Bachelor,5,18000,1
52,Male,Black,Master,25,60000,0
31,Female,Asian,Bachelor,7,20000,1
41,Male,Hispanic,High School,15,30000,0
26,Female,White,Bachelor,2,10000,0
35,Male,White,Master,10,40000,1
27,Female,Black,Bachelor,4,14000,0
48,Male,White,PhD,22,70000,1
33,Female,Hispanic,Bachelor,8,22000,0
39,Male,Asian,Master,14,35000,1
55,Male,White,Master,28,80000,1
30,Female,Black,Bachelor,6,16000,0
44,Male,Hispanic,Bachelor,18,42000,0
37,Female,White,Master,11,32000,1
25,Male,Asian,Bachelor,2,11000,1
42,Female,Black,Master,16,38000,0
36,Male,White,Bachelor,9,27000,1
29,Female,Hispanic,High School,4,13000,0
50,Male,White,PhD,24,65000,1
32,Female,Asian,Bachelor,7,21000,1
47,Male,Black,Bachelor,20,45000,0
28,Female,White,Bachelor,3,15000,1
40,Male,Hispanic,Master,14,36000,0
35,Female,White,Bachelor,9,28000,1
53,Male,White,PhD,26,75000,1`

// ── Risk Colors ───────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  Low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', color: '#10b981' },
  Medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-400', color: '#f59e0b' },
  High: { bg: 'bg-rose-500/10', border: 'border-rose-500/25', text: 'text-rose-400', color: '#f43f5e' },
  Critical: { bg: 'bg-rose-500/15', border: 'border-rose-500/40', text: 'text-rose-300', color: '#f43f5e' },
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [apiKey, setApiKey] = useState('AIzaSyAKP74-uFI41rULQCDCYKUk5CSVDzQrB6M')
  const [showKey, setShowKey] = useState(false)
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, string | number>[] } | null>(null)
  const [fileName, setFileName] = useState('')
  const [targetCol, setTargetCol] = useState('approved')
  const [protectedCols, setProtectedCols] = useState('gender, race')
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'ai' | 'fixes'>('overview')
  const fileRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // ── Parse CSV ──────────────────────────────────────────────────────────────
  const parseCSV = useCallback((text: string, name: string) => {
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
    const headers = parsed.meta.fields || []
    const rows = parsed.data.map(r => {
      const obj: Record<string, string | number> = {}
      headers.forEach(h => {
        const v = r[h]?.trim()
        obj[h] = v && !isNaN(Number(v)) ? parseFloat(v) : v || ''
      })
      return obj
    })
    setCsvData({ headers, rows })
    setFileName(name)
    setError('')
  }, [])

  // ── File Drop ──────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return }
    const reader = new FileReader()
    reader.onload = ev => parseCSV(ev.target?.result as string, file.name)
    reader.readAsText(file)
  }, [parseCSV])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => parseCSV(ev.target?.result as string, file.name)
    reader.readAsText(file)
  }, [parseCSV])

  const loadSample = useCallback(() => {
    parseCSV(SAMPLE_CSV, 'loan_decisions_sample.csv')
    setTargetCol('approved')
    setProtectedCols('gender, race')
  }, [parseCSV])

  // ── Run Analysis ───────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!apiKey.trim()) return setError('Please enter your Gemini API key')
    if (!csvData) return setError('Please upload a CSV file first')
    const cols = protectedCols.split(',').map(c => c.trim()).filter(c => csvData.headers.includes(c))
    if (cols.length === 0) return setError(`Columns not found. Available: ${csvData.headers.join(', ')}`)
    if (!csvData.headers.includes(targetCol)) return setError(`Target column "${targetCol}" not found`)

    setIsAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          rows: csvData.rows,
          headers: csvData.headers,
          targetCol,
          protectedCols: cols,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed')

      setResult(data)
      setActiveTab('overview')
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="relative z-10 min-h-screen">

      {/* ── HERO ── */}
      <section className="text-center px-6 pt-20 pb-16">
        <div className="animate-fade-up inline-flex items-center gap-2 bg-[#00d4aa15] border border-[#00d4aa33] rounded-full px-4 py-1.5 text-xs font-semibold text-[#00d4aa] tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse-dot" />
          Google Solution Challenge 2026 · Build with AI
        </div>

        <h1 className="animate-fade-up delay-100 font-display text-[clamp(52px,9vw,96px)] font-black leading-none tracking-tight mb-6">
          Equi<span className="bg-gradient-to-r from-[#00d4aa] to-[#6366f1] bg-clip-text text-transparent">Lens</span>
        </h1>

        <p className="animate-fade-up delay-200 text-[#94a3b8] text-lg max-w-xl mx-auto leading-relaxed font-light mb-12">
          Upload any decision dataset. Gemini AI surfaces hidden discrimination, quantifies who is harmed, and prescribes exactly how to fix it.
        </p>

        {/* Stats row */}
        <div className="animate-fade-up delay-300 flex justify-center gap-8 flex-wrap">
          {[
            { icon: '⚡', label: 'Gemini 2.0 Flash', sub: 'AI Engine' },
            { icon: '📊', label: 'Statistical Analysis', sub: '80% Rule + More' },
            { icon: '🛡️', label: 'Bias Detection', sub: 'Gender · Race · Age' },
            { icon: '🔧', label: 'Auto Remediation', sub: 'Fix Recommendations' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs font-semibold text-[#f1f5f9]">{s.label}</div>
              <div className="text-[11px] text-[#475569]">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INPUT SECTION ── */}
      <section className="max-w-3xl mx-auto px-6 pb-20">

        {/* API Key */}
        <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6 mb-5 animate-fade-up delay-400">
          <p className="text-[11px] font-bold text-[#00d4aa] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#00d4aa] rounded" />Step 1 · Gemini API Key
          </p>
          <div className="flex gap-3">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza... (get from aistudio.google.com)"
              className="flex-1 bg-[#1a2235] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] outline-none focus:border-[#00d4aa] transition-colors font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="bg-[#1a2235] border border-white/[0.07] rounded-xl px-4 text-[#475569] hover:text-[#00d4aa] transition-colors text-sm"
            >
              {showKey ? <Eye size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[11px] text-[#475569] mt-2">
            Your key stays in your browser. Not stored anywhere.{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-[#00d4aa] hover:underline">
              Get a free key →
            </a>
          </p>
        </div>

        {/* Upload */}
        <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6 mb-5 animate-fade-up delay-500">
          <p className="text-[11px] font-bold text-[#00d4aa] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#00d4aa] rounded" />Step 2 · Upload Dataset
          </p>

          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
              isDragging
                ? 'border-[#00d4aa] bg-[#00d4aa08]'
                : 'border-[#00d4aa30] hover:border-[#00d4aa] hover:bg-[#00d4aa05]'
            )}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <Upload size={32} className="mx-auto mb-3 text-[#00d4aa60]" />
            <p className="font-display font-bold text-base mb-1">Drop your CSV dataset here</p>
            <p className="text-sm text-[#475569]">Hiring · Loans · Medical · Admissions · Any binary decision data</p>
          </div>

          {/* File info */}
          {csvData && (
            <div className="mt-3 flex items-center gap-3 bg-[#00d4aa10] border border-[#00d4aa25] rounded-xl px-4 py-3">
              <FileText size={16} className="text-[#00d4aa]" />
              <span className="text-sm font-medium text-[#00d4aa]">{fileName}</span>
              <span className="text-xs text-[#475569] ml-auto">{csvData.rows.length} rows · {csvData.headers.length} cols</span>
            </div>
          )}

          <button
            onClick={loadSample}
            className="mt-3 flex items-center gap-2 text-xs text-[#475569] hover:text-[#00d4aa] border border-white/[0.07] hover:border-[#00d4aa30] rounded-lg px-3 py-2 transition-all"
          >
            <Zap size={12} /> Load sample loan dataset (demo)
          </button>
        </div>

        {/* Config */}
        <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6 mb-5 animate-fade-up delay-500">
          <p className="text-[11px] font-bold text-[#00d4aa] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#00d4aa] rounded" />Step 3 · Configure Columns
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-widest block mb-2">
                Target Column <span className="text-[#f43f5e]">*</span>
              </label>
              <input
                value={targetCol}
                onChange={e => setTargetCol(e.target.value)}
                placeholder="e.g. approved, hired, granted"
                className="w-full bg-[#1a2235] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] outline-none focus:border-[#00d4aa] transition-colors"
              />
              <p className="text-[11px] text-[#374151] mt-1">The AI&apos;s decision column (0/1 or yes/no)</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-widest block mb-2">
                Protected Attributes <span className="text-[#f43f5e]">*</span>
              </label>
              <input
                value={protectedCols}
                onChange={e => setProtectedCols(e.target.value)}
                placeholder="e.g. gender, race, age"
                className="w-full bg-[#1a2235] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] outline-none focus:border-[#00d4aa] transition-colors"
              />
              <p className="text-[11px] text-[#374151] mt-1">Comma-separated. Must match column names exactly.</p>
            </div>
          </div>
          {csvData && (
            <p className="text-[11px] text-[#475569] mt-3">
              Available columns: {csvData.headers.map(h => (
                <button
                  key={h}
                  onClick={() => setProtectedCols(prev => prev ? `${prev}, ${h}` : h)}
                  className="ml-1 bg-[#1a2235] hover:bg-[#00d4aa15] border border-white/[0.07] hover:border-[#00d4aa30] rounded px-2 py-0.5 text-[#94a3b8] hover:text-[#00d4aa] transition-all cursor-pointer"
                >
                  {h}
                </button>
              ))}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-[#f43f5e15] border border-[#f43f5e30] rounded-xl px-4 py-3 mb-4 text-sm text-[#f87171]">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className={clsx(
            'w-full py-5 rounded-2xl font-display font-bold text-lg tracking-wide transition-all flex items-center justify-center gap-3',
            isAnalyzing
              ? 'bg-[#00d4aa60] cursor-not-allowed text-[#0a0e1a80]'
              : 'bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0e1a] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,212,170,0.35)] active:translate-y-0'
          )}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Gemini is analyzing bias patterns...
            </>
          ) : (
            <>
              <Shield size={20} />
              Run Full Bias Audit with Gemini AI
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </section>

      {/* ── RESULTS ── */}
      {result && (
        <section ref={resultsRef} className="max-w-4xl mx-auto px-6 pb-24">

          {/* Risk Banner */}
          {(() => {
            const cfg = RISK_CONFIG[result.aiReport.risk_level] || RISK_CONFIG.High
            return (
              <div className={clsx('rounded-2xl p-6 border mb-6 animate-fade-up', cfg.bg, cfg.border)}>
                <div className="flex items-center gap-6 flex-wrap">
                  {/* Score circle */}
                  <div className="animate-score" style={{ width: 88, height: 88 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="65%" outerRadius="100%"
                        data={[{ value: result.aiReport.overall_bias_score, fill: cfg.color }]}
                        startAngle={90} endAngle={90 - 360 * result.aiReport.overall_bias_score / 100}
                      >
                        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#1a2235' }}>
                          <Cell fill={cfg.color} />
                        </RadialBar>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute ml-4 mt-1 w-[88px] flex flex-col items-center pointer-events-none" style={{ position: 'relative', left: -104, top: -88 }}>
                    <span className={clsx('font-display font-black text-2xl leading-none', cfg.text)}>{result.aiReport.overall_bias_score}</span>
                    <span className="text-[9px] text-[#475569] uppercase tracking-wider">/ 100</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={clsx('font-display font-black text-2xl', cfg.text)}>
                        {result.aiReport.risk_level} Bias Risk
                      </span>
                      {result.aiReport.ethical_flag && (
                        <span className="flex items-center gap-1.5 bg-[#f43f5e15] border border-[#f43f5e30] rounded-full px-3 py-1 text-[11px] font-bold text-[#f87171] uppercase tracking-wider">
                          <AlertTriangle size={11} /> Flagged for Ethics Review
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#cbd5e1] leading-relaxed">{result.aiReport.bias_summary}</p>
                  </div>
                  <div className="text-right text-sm text-[#475569]">
                    <div className="font-semibold text-[#94a3b8]">{result.totalRows} records</div>
                    <div>analyzed</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Tabs */}
          <div className="flex gap-1 bg-[#111827] border border-white/[0.07] rounded-xl p-1 mb-6">
            {(['overview', 'metrics', 'ai', 'fixes'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize',
                  activeTab === tab
                    ? 'bg-[#00d4aa] text-[#0a0e1a]'
                    : 'text-[#475569] hover:text-[#94a3b8]'
                )}
              >
                {tab === 'overview' ? '📊 Overview' :
                  tab === 'metrics' ? '📈 Per Attribute' :
                    tab === 'ai' ? '🤖 Gemini Analysis' : '🔧 Fix Plan'}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-up">
              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Bias Score', value: `${result.aiReport.overall_bias_score}/100`, color: RISK_CONFIG[result.aiReport.risk_level]?.color },
                  { label: 'Biased Attrs', value: `${Object.values(result.metrics).filter(m => m.biased).length}/${Object.keys(result.metrics).length}`, color: '#f43f5e' },
                  { label: 'Groups Harmed', value: result.aiReport.affected_groups.length, color: '#f59e0b' },
                  { label: 'Fix Actions', value: result.aiReport.recommended_fixes.length, color: '#00d4aa' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111827] border border-white/[0.07] rounded-xl p-4 text-center">
                    <div className="font-display font-black text-2xl mb-1" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] text-[#475569] uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Affected groups */}
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
                <h3 className="text-[11px] font-bold text-[#f43f5e] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#f43f5e] rounded" />Groups Facing Disadvantage
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.aiReport.affected_groups.map(g => (
                    <span key={g} className="bg-[#f43f5e15] border border-[#f43f5e25] rounded-full px-3 py-1.5 text-sm text-[#f87171]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Violations */}
              {result.aiReport.fairness_violations?.length > 0 && (
                <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
                  <h3 className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#f59e0b] rounded" />Fairness Standard Violations
                  </h3>
                  <ul className="space-y-2">
                    {result.aiReport.fairness_violations.map((v, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#cbd5e1]">
                        <AlertTriangle size={14} className="text-[#f59e0b] shrink-0 mt-0.5" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Business risk */}
              {result.aiReport.business_risk && (
                <div className="bg-[#f43f5e08] border border-[#f43f5e20] rounded-2xl p-5">
                  <h3 className="text-[11px] font-bold text-[#f43f5e] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#f43f5e] rounded" />Legal & Business Risk
                  </h3>
                  <p className="text-sm text-[#fca5a5] leading-relaxed">{result.aiReport.business_risk}</p>
                </div>
              )}

              {/* Positive findings */}
              {result.aiReport.positive_findings && (
                <div className="bg-[#00d4aa08] border border-[#00d4aa20] rounded-2xl p-5">
                  <h3 className="text-[11px] font-bold text-[#00d4aa] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#00d4aa] rounded" />What&apos;s Working Fairly
                  </h3>
                  <p className="text-sm text-[#6ee7b7] leading-relaxed">{result.aiReport.positive_findings}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Metrics ── */}
          {activeTab === 'metrics' && (
            <div className="space-y-4 animate-fade-up">
              {Object.entries(result.metrics).map(([attr, m], idx) => {
                const chartData = Object.entries(m.approval_rates).map(([name, rate]) => ({
                  name,
                  rate: Math.round(rate * 100),
                  fill: m.biased && name === m.min_group ? '#f43f5e' : '#00d4aa',
                }))
                return (
                  <div
                    key={attr}
                    className={clsx(
                      'bg-[#111827] border rounded-2xl p-6 animate-fade-up',
                      m.biased ? 'border-[#f43f5e30]' : 'border-[#00d4aa20]'
                    )}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                      <div>
                        <div className="text-[11px] font-bold text-[#475569] uppercase tracking-widest mb-1">Protected Attribute</div>
                        <div className="font-display font-black text-xl capitalize">{attr}</div>
                      </div>
                      <div className="text-right">
                        <div className={clsx('font-display font-black text-3xl', m.biased ? 'text-[#f43f5e]' : 'text-[#00d4aa]')}>
                          {m.disparity_ratio}
                        </div>
                        <div className="text-[11px] text-[#475569]">disparity ratio</div>
                        <div className={clsx('text-[11px] font-bold mt-1 flex items-center gap-1 justify-end', m.biased ? 'text-[#f87171]' : 'text-[#34d399]')}>
                          {m.biased
                            ? <><XCircle size={11} /> 80% Rule Violated</>
                            : <><CheckCircle size={11} /> Within Fair Range</>}
                        </div>
                      </div>
                    </div>

                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                          <Tooltip
                            contentStyle={{ background: '#1a2235', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 12 }}
                            formatter={(v: number) => [`${v}%`, 'Approval Rate']}
                          />
                          <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-[#1a2235] rounded-xl p-3 text-center">
                        <div className="text-[11px] text-[#475569] mb-1">Gap</div>
                        <div className="font-display font-bold text-lg text-[#f59e0b]">{Math.round(m.disparity_gap * 100)}pp</div>
                      </div>
                      <div className="bg-[#1a2235] rounded-xl p-3 text-center">
                        <div className="text-[11px] text-[#475569] mb-1">Most Affected</div>
                        <div className="font-display font-bold text-lg text-[#f87171] truncate">{m.min_group}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Tab: AI Analysis ── */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-display font-bold text-base">Gemini AI Deep Analysis</h3>
                  <span className="bg-gradient-to-r from-[#4285f4] to-[#a142f4] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Gemini 2.0 Flash
                  </span>
                </div>
                <div className="border-l-2 border-[#00d4aa] pl-5 text-[#cbd5e1] text-sm leading-relaxed mb-6">
                  {result.aiReport.detailed_findings}
                </div>
                <div className="text-[11px] font-bold text-[#6366f1] uppercase tracking-widest mb-3">Most Biased Attribute</div>
                <div className="bg-[#6366f115] border border-[#6366f125] rounded-xl px-4 py-3 text-base font-display font-bold text-[#a5b4fc] capitalize">
                  {result.aiReport.most_biased_attribute}
                </div>
              </div>

              {result.aiReport.flag_reason && (
                <div className="bg-[#f43f5e10] border border-[#f43f5e25] rounded-2xl p-5 flex gap-4">
                  <AlertTriangle size={22} className="text-[#f43f5e] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-display font-bold text-[#f87171] mb-2">Ethical Review Required</div>
                    <p className="text-sm text-[#fca5a5] leading-relaxed">{result.aiReport.flag_reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Fix Plan ── */}
          {activeTab === 'fixes' && (
            <div className="space-y-3 animate-fade-up">
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6">
                <h3 className="text-[11px] font-bold text-[#00d4aa] uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#00d4aa] rounded" />Gemini&apos;s Remediation Plan
                </h3>
                <ol className="space-y-3">
                  {result.aiReport.recommended_fixes.map((fix, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-4 p-4 bg-[#1a2235] rounded-xl animate-slide-in"
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <span className="w-7 h-7 bg-[#00d4aa15] border border-[#00d4aa25] rounded-lg flex items-center justify-center text-[11px] font-bold text-[#00d4aa] shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-[#cbd5e1] leading-relaxed pt-0.5">{fix}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-[#6366f108] border border-[#6366f120] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-[#6366f1]" />
                  <span className="text-[11px] font-bold text-[#6366f1] uppercase tracking-widest">Next Step</span>
                </div>
                <p className="text-sm text-[#a5b4fc]">
                  After applying fixes, re-run EquiLens to verify the disparity ratio improves above 0.8 for all protected attributes.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.07] py-8 text-center relative z-10">
        <div className="flex justify-center items-center gap-6 mb-3 flex-wrap">
          <a href="https://github.com/cbrethick/EquiLens" target="_blank" rel="noopener"
            className="flex items-center gap-2 text-[#475569] hover:text-[#00d4aa] transition-colors text-sm">
            <Github size={14} /> GitHub
          </a>
          <a href="https://aistudio.google.com" target="_blank" rel="noopener"
            className="flex items-center gap-2 text-[#475569] hover:text-[#00d4aa] transition-colors text-sm">
            <ExternalLink size={14} /> Google AI Studio
          </a>
        </div>
        <p className="text-[#374151] text-xs">
          Built by <span className="text-[#00d4aa]">Rethick-Nakshatra-Ashwitha</span> · EquiLens ·
          Google Solution Challenge 2026 · Powered by{' '}
          <span className="bg-gradient-to-r from-[#4285f4] to-[#a142f4] bg-clip-text text-transparent font-semibold">
            Gemini 2.0 Flash
          </span>
        </p>
      </footer>
    </main>
  )
}
