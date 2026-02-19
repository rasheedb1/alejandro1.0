import { NextResponse } from 'next/server'

const SHEET_ID = '10DRhJ5xHYV1JX6FJWRSgL4__AekBS-iLsOTZkydXYpg'
const QUOTA_GID = '2067060072'
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface SheetSDRQuota {
  fullName: string
  region: string
  quota: number
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const targetMonth = `${MONTH_ABBR[month - 1]}-${String(year).slice(-2)}`

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${QUOTA_GID}`

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)

    const text = await res.text()
    const rows = text.trim().split('\n').map(parseCSVLine)

    // Find the header row that has the full monthly breakdown (contains the target month)
    // We want the second header table (row ~17) which covers Jun-25 through Jun-26
    let headerRowIdx = -1
    let monthColIdx = -1

    for (let i = 0; i < rows.length; i++) {
      const colIdx = rows[i].indexOf(targetMonth)
      if (colIdx !== -1) {
        // Make sure this header row has a broad range of months (the main quota table)
        const hasFullRange = rows[i].some(
          (c) => c.startsWith('Jun-') || c.startsWith('Jul-') || c.startsWith('Aug-')
        )
        if (hasFullRange) {
          headerRowIdx = i
          monthColIdx = colIdx
          // don't break — keep scanning so we use the LAST matching header (B17:Q38 table)
        }
      }
    }

    if (headerRowIdx === -1) {
      return NextResponse.json(
        { error: `Month ${targetMonth} not found in quota sheet` },
        { status: 404 }
      )
    }

    const sdrs: SheetSDRQuota[] = []
    let currentRegion = ''

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i]
      const regionCell = row[1]?.trim() || ''
      const nameCell = row[2]?.trim() || ''

      if (!nameCell) continue
      if (nameCell.toLowerCase().startsWith('total')) continue
      if (regionCell.toLowerCase() === 'lead') continue // skip user/manager row

      if (regionCell) currentRegion = regionCell

      const quotaStr = row[monthColIdx]?.trim() || ''
      const quota = quotaStr !== '' ? parseInt(quotaStr) || 0 : 0
      if (quota === 0) continue // skip inactive SDRs

      sdrs.push({ fullName: nameCell, region: currentRegion, quota })
    }

    return NextResponse.json({ sdrs, month, year, targetMonth })
  } catch (err) {
    console.error('Sheets quota error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
