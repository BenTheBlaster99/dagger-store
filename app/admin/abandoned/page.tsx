'use client'

import AdminCrmTable from '@/components/AdminCrmTable'

export default function AdminAbandonedPage() {
  return (
    <AdminCrmTable
      source="abandoned"
      title="Abandoned checkouts"
      subtitle="partial checkouts (live + imported)"
    />
  )
}
