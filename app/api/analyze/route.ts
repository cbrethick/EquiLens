import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface MetricGroup {
  total: number
  positive: number
}

interface AttributeMetric {
  approval_rates: Record<string, number>
  disparity_ratio: number
  disparity_gap: number
  biased: boolean
  max_group: string
  min_group: string
}

function computeMetrics(
  rows: Record<string, string | number>[],
  targetCol: string,
  protectedCols: string[]
): Record<string, AttributeMetric> {
  const metrics: Record<string, AttributeMetric> = {}

  for (const col of protectedCols) {
    const groups: Record<string, MetricGroup> = {}

    for (const row of rows) {
      const g = String(row[col])
      const t = row[targetCol]
      if (g === 'undefined' || t === undefined) continue
      if (!groups[g]) groups[g] = { total: 0, positive: 0 }
      groups[g].total++
      if (t == 1 || t === 'yes' || t === 'true' || t === '1') {
        groups[g].positive++
      }
    }

    const rates: Record<string, number> = {}
    for (const [g, v] of Object.entries(groups)) {
      rates[g] = v.total > 0 ? Math.round((v.positive / v.total) * 1000) / 1000 : 0
    }

    const vals = Object.values(rates)
    const maxRate = Math.max(...vals)
    const minRate = Math.min(...vals)
    const ratio = maxRate > 0 ? Math.round((minRate / maxRate) * 1000) / 1000 : 1
    const gap = Math.round((maxRate - minRate) * 1000) / 1000

    const maxGroup = Object.keys(rates).find(k => rates[k] === maxRate) || ''
    const minGroup = Object.keys(rates).find(k => rates[k] === minRate) || ''

    metrics[col] = {
      approval_rates: rates,
      disparity_ratio: ratio,
      disparity_gap: gap,
      biased: ratio < 0.8,
      max_group: maxGroup,
      min_group: minGroup,
    }
  }

  return metrics
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKey, rows, headers, targetCol, protectedCols } = body

    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 400 })
    if (!rows || !headers || !targetCol || !protectedCols) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Compute local statistical metrics
    const metrics = computeMetrics(rows, targetCol, protectedCols)

    // Build sample for Gemini context
    const sampleRows = rows.slice(0, 10).map((r: Record<string, string | number>) =>
      headers.map((h: string) => r[h]).join(',')
    ).join('\n')

    const metricsText = JSON.stringify(metrics, null, 2)
    const totalRows = rows.length

    const prompt = `You are EquiLens, a world-class AI fairness and ethics auditor with deep expertise in algorithmic bias, disparate impact law, and machine learning fairness.

Your task: Perform a comprehensive bias audit on this decision-making dataset.

═══════════════════════════════════════
DATASET OVERVIEW
═══════════════════════════════════════
Total records: ${totalRows}
Decision column (what the AI decides): "${targetCol}"
Protected attributes being audited: ${protectedCols.join(', ')}
All columns: ${headers.join(', ')}

═══════════════════════════════════════
COMPUTED FAIRNESS METRICS
═══════════════════════════════════════
${metricsText}

═══════════════════════════════════════
SAMPLE DATA (headers: ${headers.join(', ')})
═══════════════════════════════════════
${sampleRows}

═══════════════════════════════════════
FAIRNESS STANDARDS TO APPLY
═══════════════════════════════════════
1. The 80% Rule (US EEOC): If disparity_ratio < 0.8, legally recognized disparate impact
2. Demographic Parity: Equal approval rates across groups
3. Equalized Odds: Equal true/false positive rates across groups
4. Individual Fairness: Similar individuals receive similar outcomes

═══════════════════════════════════════
REQUIRED OUTPUT
═══════════════════════════════════════
Output ONLY a valid JSON object. No markdown, no explanation, no extra text.

{
  "overall_bias_score": <integer 0-100, 100 = maximum bias>,
  "risk_level": "<Low|Medium|High|Critical>",
  "bias_summary": "<2 powerful sentences: what bias exists AND its real-world human impact>",
  "most_biased_attribute": "<column name with worst disparity>",
  "affected_groups": ["<group that faces disadvantage>", "..."],
  "advantaged_groups": ["<group that benefits from bias>", "..."],
  "recommended_fixes": [
    "<specific technical fix 1>",
    "<specific technical fix 2>", 
    "<specific technical fix 3>",
    "<process/policy fix>",
    "<monitoring/audit fix>"
  ],
  "ethical_flag": <true if bias_score > 40 or any disparity_ratio < 0.8>,
  "flag_reason": "<specific legal/ethical concern, or empty string>",
  "detailed_findings": "<4 sentences: root cause analysis, which groups are harmed, magnitude of discrimination, and urgency of remediation>",
  "fairness_violations": ["<violation 1>", "<violation 2>"],
  "business_risk": "<1 sentence on legal/reputational risk if this system is deployed>",
  "positive_findings": "<1 sentence on what is working fairly, if anything>"
}`

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 2048,
            topP: 0.95,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errData = await geminiRes.json()
      return NextResponse.json(
        { error: errData.error?.message || 'Gemini API error' },
        { status: geminiRes.status }
      )
    }

    const geminiData = await geminiRes.json()
    let raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    raw = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

    let aiReport
    try {
      aiReport = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Gemini response', raw: raw.slice(0, 500) },
        { status: 500 }
      )
    }

    return NextResponse.json({ metrics, aiReport, totalRows })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
