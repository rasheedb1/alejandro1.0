export type Region = 'US' | 'LATAM' | 'APAC' | 'EMEA' | 'Inbound'

export interface SDR {
  id: string
  name: string
  region: Region
  sqls: number
  quota: number
}

export interface CalculatedMetrics {
  daysInMonth: number
  daysElapsed: number
  daysRemaining: number
  shouldBe: number
  mtdAchievement: number
  totalAchievement: number
  reportDate: string
  monthName: string
}

export interface SDRCalculated extends SDR {
  shouldBe: number
  mtdAchievement: number
  totalAchievement: number
}
