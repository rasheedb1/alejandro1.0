import { SDRCalculated, CalculatedMetrics } from '@/types'

interface EmailTemplateProps {
  metrics: CalculatedMetrics
  teamQuota: number
  sqlsMTD: number
  sdrs: SDRCalculated[]
  screenshotSrc?: string
}

function achievementStyle(pct: number): { bg: string; text: string; border: string } {
  if (pct >= 100) return { bg: '#f0fdf4', text: '#15803d', border: '#86efac' }
  if (pct >= 75) return { bg: '#fefce8', text: '#a16207', border: '#fde047' }
  return { bg: '#fff1f2', text: '#b91c1c', border: '#fca5a5' }
}

export function generateEmailHTML({
  metrics,
  teamQuota,
  sqlsMTD,
  sdrs,
  screenshotSrc,
}: EmailTemplateProps): string {
  const {
    daysRemaining,
    shouldBe,
    mtdAchievement,
    totalAchievement,
    reportDate,
    monthName,
    daysElapsed,
    daysInMonth,
  } = metrics

  const progressPct = Math.min(totalAchievement, 100).toFixed(1)
  const achColors = achievementStyle(mtdAchievement)

  const sdrRows = sdrs
    .map((sdr) => {
      const c = achievementStyle(sdr.mtdAchievement)
      const achDisplay = sdr.quota > 0 ? `${sdr.mtdAchievement.toFixed(1)}%` : '—'
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${sdr.name}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;">
            <span style="background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:9999px;font-size:12px;">${sdr.region}</span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;font-weight:700;font-size:15px;color:#111827;">${sdr.sqls}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;font-size:14px;">${sdr.quota}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;font-size:14px;">${sdr.shouldBe}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;">
            <span style="background:${c.bg};color:${c.text};border:1px solid ${c.border};padding:3px 10px;border-radius:9999px;font-size:13px;font-weight:700;">${achDisplay}</span>
          </td>
        </tr>`
    })
    .join('')

  const screenshotSection = screenshotSrc
    ? `
      <tr>
        <td style="background:#fff;padding:0 40px 28px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">📊 Salesforce Dashboard</p>
          <img src="${screenshotSrc}" alt="Salesforce Dashboard" style="width:100%;border-radius:10px;border:1px solid #e5e7eb;display:block;" />
        </td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Mid-Week Quota Report — ${monthName} | Yuno SDR</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%);border-radius:16px 16px 0 0;padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Yuno · SDR Team</p>
                    <h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:800;line-height:1.2;">Mid-Week Quota Report</h1>
                  </td>
                  <td align="right" valign="top">
                    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 18px;text-align:center;display:inline-block;">
                      <p style="margin:0;color:rgba(255,255,255,0.75);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Report Date</p>
                      <p style="margin:5px 0 0;color:#fff;font-size:16px;font-weight:700;">${reportDate}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- METRIC CARDS -->
          <tr>
            <td style="background:#fff;padding:28px 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="31%" style="background:#faf5ff;border:1px solid #ede9fe;border-radius:12px;padding:20px 12px;text-align:center;">
                    <p style="margin:0 0 6px;color:#7C3AED;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">SQLs MTD</p>
                    <p style="margin:0;color:#3b0764;font-size:42px;font-weight:800;line-height:1;">${sqlsMTD}</p>
                    <p style="margin:6px 0 0;color:#8b5cf6;font-size:12px;">of ${teamQuota} quota</p>
                  </td>
                  <td width="3%"></td>
                  <td width="31%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 12px;text-align:center;">
                    <p style="margin:0 0 6px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Should Be</p>
                    <p style="margin:0;color:#111827;font-size:42px;font-weight:800;line-height:1;">${shouldBe}</p>
                    <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">day ${daysElapsed} of ${daysInMonth}</p>
                  </td>
                  <td width="3%"></td>
                  <td width="31%" style="background:${achColors.bg};border:1px solid ${achColors.border};border-radius:12px;padding:20px 12px;text-align:center;">
                    <p style="margin:0 0 6px;color:${achColors.text};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Monthly Achievement</p>
                    <p style="margin:0;color:${achColors.text};font-size:42px;font-weight:800;line-height:1;">${totalAchievement.toFixed(1)}%</p>
                    <p style="margin:6px 0 0;color:${achColors.text};font-size:12px;opacity:0.8;">vs pace: ${mtdAchievement.toFixed(1)}%</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PROGRESS BAR -->
          <tr>
            <td style="background:#fff;padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                <tr>
                  <td style="font-size:12px;color:#6b7280;font-weight:600;">Monthly Quota Progress</td>
                  <td align="right" style="font-size:12px;color:#6b7280;font-weight:600;">${totalAchievement.toFixed(1)}%</td>
                </tr>
              </table>
              <div style="background:#f3f4f6;border-radius:9999px;height:10px;overflow:hidden;">
                <div style="background:linear-gradient(90deg,#7C3AED,#a78bfa);height:10px;width:${progressPct}%;border-radius:9999px;"></div>
              </div>
              <p style="margin:10px 0 0;font-size:13px;color:#374151;">
                ⏱️ <strong>${daysRemaining} days remaining</strong> in ${monthName} &middot; ${daysElapsed} of ${daysInMonth} days elapsed
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="background:#fff;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;" />
            </td>
          </tr>

          <!-- SDR TABLE -->
          <tr>
            <td style="background:#fff;padding:0 40px 28px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Team Breakdown</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">SDR</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Region</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">SQLs</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Quota</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Should Be</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  ${sdrRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- SCREENSHOT -->
          ${screenshotSection}

          <!-- FOOTER -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b0764 0%,#4c1d95 100%);border-radius:0 0 16px 16px;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:rgba(255,255,255,0.55);font-size:12px;">Generated on ${reportDate}</td>
                  <td align="right" style="color:rgba(255,255,255,0.55);font-size:12px;">Powered by Yuno SDR Team</td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
