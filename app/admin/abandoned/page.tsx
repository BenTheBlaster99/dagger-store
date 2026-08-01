'use client'

import AdminCrmTable from '@/components/AdminCrmTable'

export default function AdminAbandonedPage() {
  return (
    <AdminCrmTable
      source="abandoned"
      title="Abandoned orders"
      subtitle="imported abandoned checkouts"
    />
  )
}
