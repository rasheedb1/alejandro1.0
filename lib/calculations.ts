import { SDR, CalculatedMetrics, SDRCalculated } from '@/types'

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function calculateTeamMetrics(
  quota: number,
  sqls: number,
  month: number,
  year: number
): CalculatedMetrics {
  const today = new Date()
  const daysInMonth = getDaysInMonth(month, year)

  let daysElapsed: number
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year
  const isPastMonth =
    today.getFullYear() > year ||
    (today.getFullYear() === year && today.getMonth() + 1 > month)

  if (isCurrentMonth) {
    daysElapsed = today.getDate()
  } else if (isPastMonth) {
    daysElapsed = daysInMonth
  } else {
    daysElapsed = 1
  }

  const daysRemaining = daysInMonth - daysElapsed
  const shouldBe = Math.floor((quota * daysElapsed) / daysInMonth)
  const mtdAchievement = shouldBe > 0 ? (sqls / shouldBe) * 100 : 0
  const totalAchievement = quota > 0 ? (sqls / quota) * 100 : 0
  const reportDate = `${MONTHS[month - 1]} ${daysElapsed}, ${year}`

  return {
    daysInMonth,
    daysElapsed,
    daysRemaining,
    shouldBe,
    mtdAchievement,
    totalAchievement,
    reportDate,
    monthName: MONTHS[month - 1],
  }
}

export function calculateSDRMetrics(
  sdr: SDR,
  daysElapsed: number,
  daysInMonth: number
): SDRCalculated {
  const shouldBe = Math.floor((sdr.quota * daysElapsed) / daysInMonth)
  const mtdAchievement = shouldBe > 0 ? (sdr.sqls / shouldBe) * 100 : 0
  const totalAchievement = sdr.quota > 0 ? (sdr.sqls / sdr.quota) * 100 : 0

  return { ...sdr, shouldBe, mtdAchievement, totalAchievement }
}
