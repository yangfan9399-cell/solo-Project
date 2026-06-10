'use client'
import { useState } from 'react'
import { Button, Card } from '@nextui-org/react'
import Sidebar from '@/components/Sidebar'
import ApplicationList from '@/components/ApplicationList'
import ApplicationForm from '@/components/ApplicationForm'
import ApplicationDetail from '@/components/ApplicationDetail'

export default function ApplicationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null)

  const handleSubmit = async (data: {
    employeeId: string
    softwareId: string
    departmentId: string
    reason: string
    requestedSeats: number
    useScope: string
  }) => {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (response.ok) {
      setShowForm(false)
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active="applications" />
      <div className="ml-56 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">申请管理</h1>
            <p className="text-gray-500 mt-1">软件许可证申请与审批</p>
          </div>
          <Button color="primary" onClick={() => setShowForm(true)}>
            新建申请
          </Button>
        </div>

        <Card className="p-6">
          <ApplicationList onViewDetail={setSelectedApplication} />
        </Card>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">新建许可证申请</h2>
              </div>
              <div className="p-6">
                <ApplicationForm onSubmit={handleSubmit} />
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedApplication && (
          <ApplicationDetail
            id={selectedApplication}
            onClose={() => setSelectedApplication(null)}
          />
        )}
      </div>
    </div>
  )
}