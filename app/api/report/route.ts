import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

interface WrongItem {
  en: string
  hr: string[]       // all accepted Croatian translations
  direction: string
  heard: string
}

interface ReportPayload {
  userName: string
  lessonTitle: string
  correct: number
  total: number
  timestamp: string   // ISO string
  wrong: WrongItem[]
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const TO_EMAIL = process.env.REPORT_TO_EMAIL ?? 'kresimir.marenic@gmail.com'
  const FROM_EMAIL = process.env.REPORT_FROM_EMAIL ?? 'onboarding@resend.dev'

  if (!apiKey) {
    // Silently succeed when key not configured (dev environment)
    return NextResponse.json({ ok: true, skipped: true })
  }

  const body: ReportPayload = await req.json()
  const { userName, lessonTitle, correct, total, timestamp, wrong } = body

  const date = new Date(timestamp).toLocaleString('hr-HR', {
    timeZone: 'Europe/Zagreb',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0
  const scoreEmoji = scorePercent >= 90 ? '🎉' : scorePercent >= 60 ? '👍' : '💪'

  const wrongRows = wrong
    .map(
      (w) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">
            ${w.direction === 'en-hr' ? w.en : w.hr[0]}
          </td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;color:#16a34a;font-weight:600;">
            ${w.direction === 'en-hr' ? w.hr.join(' / ') : w.en}
          </td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;color:#ef4444;">
            ${w.heard || '—'}
          </td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:24px;border-radius:16px;">
      <h2 style="color:#4338ca;margin-top:0;">${scoreEmoji} Izvještaj vježbe — ${userName}</h2>
      <p style="color:#64748b;margin-top:0;">${date} · ${lessonTitle}</p>

      <div style="background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #e2e8f0;text-align:center;">
        <p style="font-size:36px;font-weight:bold;color:#4338ca;margin:0;">
          ${correct} / ${total}
        </p>
        <p style="color:#64748b;margin:4px 0 0;">${scorePercent}% točno</p>
      </div>

      ${
        wrong.length > 0
          ? `<h3 style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">
               Pogrešne riječi (${wrong.length})
             </h3>
             <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
               <thead>
                 <tr style="background:#f1f5f9;">
                   <th style="padding:8px 12px;text-align:left;font-size:12px;color:#94a3b8;">Pitanje</th>
                   <th style="padding:8px 12px;text-align:left;font-size:12px;color:#94a3b8;">Točan odgovor</th>
                   <th style="padding:8px 12px;text-align:left;font-size:12px;color:#94a3b8;">Čulo se</th>
                 </tr>
               </thead>
               <tbody>${wrongRows}</tbody>
             </table>`
          : `<p style="color:#16a34a;font-weight:600;">✅ Sve točno!</p>`
      }
    </div>
  `

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: `[Engleski] ${userName} — ${lessonTitle} (${correct}/${total})`,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ ok: false, error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
