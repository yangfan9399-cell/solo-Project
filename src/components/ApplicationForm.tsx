import { useState, useEffect } from 'react'
import { Button, Input, Textarea } from '@nextui-org/react'

interface ApplicationFormProps {
  onSubmit: (data: {
    employeeId: string
    softwareId: string
    departmentId: string
    reason: string
    requestedSeats: number
    useScope: string
  }) => void
}

export default function ApplicationForm({ onSubmit }: ApplicationFormProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [software, setSoftware] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [formData, setFormData] = useState({
    employeeId: '',
    softwareId: '',
    departmentId: '',
    reason: '',
    requestedSeats: 1,
    useScope: '',
  })

  useEffect(() => {
    fetch('/api/employees').then((res) => res.json()).then(setEmployees)
    fetch('/api/software').then((res) => res.json()).then(setSoftware)
    fetch('/api/departments').then((res) => res.json()).then(setDepartments)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">申请人</label>
          <select
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择申请人</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
          <select
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择部门</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">软件</label>
          <select
            value={formData.softwareId}
            onChange={(e) => setFormData({ ...formData, softwareId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择软件</option>
            {software.map((sw) => (
              <option key={sw.id} value={sw.id}>
                {sw.name} ({sw.usedSeats}/{sw.totalSeats})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="申请席位"
          type="number"
          value={formData.requestedSeats.toString()}
          onChange={(e) => setFormData({ ...formData, requestedSeats: parseInt(e.target.value) || 1 })}
          min={1}
          required
        />
      </div>

      <Textarea
        label="申请理由"
        placeholder="请说明申请理由"
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        required
      />

      <Textarea
        label="使用范围"
        placeholder="请说明软件使用范围"
        value={formData.useScope}
        onChange={(e) => setFormData({ ...formData, useScope: e.target.value })}
        required
      />

      <Button type="submit" color="primary" className="w-full">
        提交申请
      </Button>
    </form>
  )
}