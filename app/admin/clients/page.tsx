'use client'

import AdminCrmTable from '@/components/AdminCrmTable'

export default function AdminClientsPage() {
  return (
    <AdminCrmTable
      source="client"
      title="Current clients"
      subtitle="imported nocturnal drop orders"
    />
  )
}
