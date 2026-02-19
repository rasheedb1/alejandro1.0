import { NextResponse } from 'next/server'

const SF_LOGIN_URL = 'https://login.salesforce.com'
const REPORT_ID = '00OPs000004p1cTMAQ'

interface SFToken {
  access_token: string
  instance_url: string
}

async function getSFToken(): Promise<SFToken> {
  const clientId = process.env.SF_CLIENT_ID
  const clientSecret = process.env.SF_CLIENT_SECRET
  const username = process.env.SF_USERNAME
  const password = process.env.SF_PASSWORD // password + security_token concatenated

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Salesforce env vars not configured (SF_CLIENT_ID, SF_CLIENT_SECRET, SF_USERNAME, SF_PASSWORD)')
  }

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  })

  const res = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SF auth failed: ${err}`)
  }

  return res.json()
}

export async function GET() {
  try {
    const token = await getSFToken()

    // Fetch report with includeDetails to get row-level data
    const reportUrl = `${token.instance_url}/services/data/v59.0/analytics/reports/${REPORT_ID}?includeDetails=true`
    const res = await fetch(reportUrl, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Report fetch failed: ${err}`)
    }

    const data = await res.json()

    // Parse the report factMap — grouped summary report structure
    // groupingsDown gives the row groups (SDR names), factMap has the aggregates
    const sqls: { name: string; sqls: number }[] = []
    const groupings = data.groupingsDown?.groupings ?? []
    const factMap = data.factMap ?? {}

    if (groupings.length > 0) {
      // Summary/matrix report: each group has a key, factMap[key + "!T"] has the row total
      for (const group of groupings) {
        const key = `${group.key}!T`
        const fact = factMap[key]
        const count = fact?.aggregates?.[0]?.value ?? 0
        sqls.push({ name: group.label, sqls: typeof count === 'number' ? count : parseInt(count) || 0 })
      }
    } else {
      // Tabular report fallback: iterate rows in factMap "T!T" → rows in reportExtendedMetadata
      const rows = data.factMap?.['T!T']?.rows ?? []
      const cols = data.reportExtendedMetadata?.detailColumnInfo ?? {}
      const colKeys = Object.keys(cols)

      // Find owner name column and count
      const nameColIdx = colKeys.findIndex((k) => k.toLowerCase().includes('owner') || k.toLowerCase().includes('name'))
      const countColIdx = colKeys.findIndex((k) => k.toLowerCase().includes('count') || k.toLowerCase().includes('id'))

      if (nameColIdx !== -1) {
        const tally: Record<string, number> = {}
        for (const row of rows) {
          const name = row.dataCells?.[nameColIdx]?.label ?? ''
          tally[name] = (tally[name] ?? 0) + 1
        }
        for (const [name, count] of Object.entries(tally)) {
          if (name) sqls.push({ name, sqls: count })
        }
      }
    }

    return NextResponse.json({ sqls })
  } catch (err) {
    console.error('SF SQLs error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
