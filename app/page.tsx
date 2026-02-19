import { redirect } from 'next/navigation'
import QuotaForm from '@/components/QuotaForm'

export default function Home() {
  if (process.env.APP_MODE === 'chief') {
    redirect('/research')
  }
  return <QuotaForm />
}
