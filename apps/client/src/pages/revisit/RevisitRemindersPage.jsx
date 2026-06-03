import React, { useState, useMemo } from 'react'
import {
  Tabs,
  Button,
  Space,
  Form,
  Input,
  Select,
  Row,
  Col,
  Descriptions,
  Tag,
  message,
  Modal
} from 'antd'
import {
  SendOutlined,
  CheckCircleOutlined,
  SendOutlined as BulkSendOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { revisitRemindersAPI, petsAPI, ownersAPI, usersAPI, vaccinationsAPI } from '../../api'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import DataTable, { columnHelper } from '../../components/common/DataTable'
import ModalForm from '../../components/common/ModalForm'
import StatusBadge from '../../components/common/StatusBadge'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const reminderTypeMap = {
  booster: { label: '加强针', color: 'blue' },
  recheck: { label: '复诊', color: 'orange' },
  annual: { label: '年度体检', color: 'green' }
}

const statusMap = {
  pending: { label: '待发送', color: 'gold' },
  sent: { label: '已发送', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' }
}

function RevisitRemindersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('pending')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [sendForm] = Form.useForm()
  const [completeForm] = Form.useForm()

  const { data: remindersData, isLoading, error, refetch } = useQuery({
    queryKey: ['revisit-reminders', { status: activeTab, ...pagination }],
    queryFn: () => revisitRemindersAPI.getList({
      status: activeTab,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: '-reminder_date'
    })
  })

  const { data: pets } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petsAPI.getList(),
    select: (res) => res.data || []
  })

  const { data: owners } = useQuery({
    queryKey: ['owners'],
    queryFn: () => ownersAPI.getList(),
    select: (res) => res.data || []
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getList(),
    select: (res) => res.data || []
  })

  const { data: vaccinations } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: () => vaccinationsAPI.getList(),
    select: (res) => res.data || []
  })

  const { data: pendingReminders } = useQuery({
    queryKey: ['pending-reminders'],
    queryFn: () => revisitRemindersAPI.getPending(),
    select: (res) => res.items || []
  })

  const sendMutation = useMutation({
    mutationFn: ({ id, data }) => revisitRemindersAPI.send(id, data),
    onSuccess: () => {
      message.success('提醒发送成功')
      setSendModalOpen(false)
      sendForm.resetFields()
      queryClient.invalidateQueries(['revisit-reminders'])
      queryClient.invalidateQueries(['pending-reminders'])
    },
    onError: (err) => message.error(err.message)
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => revisitRemindersAPI.complete(id, data),
    onSuccess: () => {
      message.success('标记完成成功')
      setCompleteModalOpen(false)
      completeForm.resetFields()
      queryClient.invalidateQueries(['revisit-reminders'])
    },
    onError: (err) => message.error(err.message)
  })

  const bulkSendMutation = useMutation({
    mutationFn: async (ids) => {
      const results = []
      for (const id of ids) {
        const result = await revisitRemindersAPI.send(id, { sent_by: 1 })
        results.push(result)
      }
      return results
    },
    onSuccess: (data) => {
      message.success(`成功发送 ${data.length} 条提醒`)
      setSelectedRowKeys([])
      queryClient.invalidateQueries(['revisit-reminders'])
      queryClient.invalidateQueries(['pending-reminders'])
    },
    onError: (err) => message.error(err.message)
  })

  const getPetName = (petId) => {
    const pet = pets?.find(p => p.id === petId)
    return pet?.name || '-'
  }

  const getOwnerName = (petId) => {
    const pet = pets?.find(p => p.id === petId)
    if (!pet) return '-'
    const owner = owners?.find(o => o.id === pet.owner_id)
    return owner?.name || '-'
  }

  const getOwnerPhone = (petId) => {
    const pet = pets?.find(p => p.id === petId)
    if (!pet) return '-'
    const owner = owners?.find(o => o.id === pet.owner_id)
    return owner?.phone || '-'
  }

  const getVaccinationInfo = (vaccinationRecordId) => {
    if (!vaccinationRecordId) return '-'
    const vaccination = vaccinations?.find(v => v.id === vaccinationRecordId)
    return vaccination ? `疫苗接种 #${vaccinationRecordId}` : '-'
  }

  const handleSend = (reminder) => {
    setSelectedReminder(reminder)
    sendForm.resetFields()
    setSendModalOpen(true)
  }

  const handleComplete = (reminder) => {
    setSelectedReminder(reminder)
    completeForm.resetFields()
    setCompleteModalOpen(true)
  }

  const handleViewDetail = (reminder) => {
    setSelectedReminder(reminder)
    setDetailModalOpen(true)
  }

  const handleSendSubmit = async (values) => {
    if (!selectedReminder) return
    sendMutation.mutate({ id: selectedReminder.id, data: values })
  }

  const handleCompleteSubmit = async (values) => {
    if (!selectedReminder) return
    completeMutation.mutate({ id: selectedReminder.id, data: values })
  }

  const handleBulkSend = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要发送的提醒')
      return
    }
    Modal.confirm({
      title: '批量发送提醒',
      content: `确定要发送选中的 ${selectedRowKeys.length} 条提醒吗？`,
      onOk: () => {
        bulkSendMutation.mutate(selectedRowKeys)
      }
    })
  }

  const handleTableChange = (page, filters, sorter) => {
    setPagination({
      page: page.current,
      pageSize: page.pageSize
    })
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'pending'
    })
  }

  const columns = useMemo(() => [
    columnHelper.date('提醒日期', 'reminder_date', 'YYYY-MM-DD'),
    {
      title: '类型',
      dataIndex: 'reminder_type',
      key: 'reminder_type',
      render: (type) => {
        const info = reminderTypeMap[type]
        return info ? <Tag color={info.color}>{info.label}</Tag> : type
      }
    },
    {
      title: '宠物名称',
      dataIndex: 'pet_id',
      key: 'pet_name',
      render: (petId) => getPetName(petId)
    },
    {
      title: '主人名称',
      dataIndex: 'pet_id',
      key: 'owner_name',
      render: (petId) => getOwnerName(petId)
    },
    {
      title: '主人电话',
      dataIndex: 'pet_id',
      key: 'owner_phone',
      render: (petId) => getOwnerPhone(petId)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="reminder" status={status} />
    },
    {
      title: '相关疫苗',
      dataIndex: 'vaccination_record_id',
      key: 'vaccination',
      render: (recordId) => getVaccinationInfo(recordId)
    },
    columnHelper.actions((_, record) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
        {record.status === 'pending' && (
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleSend(record)}
          >
            发送
          </Button>
        )}
        {(record.status === 'pending' || record.status === 'sent') && (
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleComplete(record)}
          >
            完成
          </Button>
        )}
      </Space>
    ))
  ], [pets, owners, vaccinations])

  const tableData = remindersData?.items?.map(item => ({
    ...item,
    key: item.id
  })) || []

  const tablePagination = remindersData?.pagination ? {
    page: remindersData.pagination.page,
    pageSize: remindersData.pagination.pageSize,
    total: remindersData.pagination.total
  } : null

  const extra = activeTab === 'pending' && (
    <Button
      type="primary"
      icon={<BulkSendOutlined />}
      onClick={handleBulkSend}
      disabled={selectedRowKeys.length === 0}
      loading={bulkSendMutation.isPending}
    >
      批量发送 ({selectedRowKeys.length})
    </Button>
  )

  return (
    <div>
      <PageHeader
        title="复诊提醒管理"
        subtitle="管理宠物复诊和疫苗加强提醒"
        showAddButton={false}
        extra={extra}
      />

      <PageContent
        loading={isLoading}
        error={error}
        empty={!isLoading && tableData.length === 0}
        emptyDescription={`暂无${statusMap[activeTab]?.label || ''}提醒`}
        onRetry={refetch}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          style={{ marginBottom: 16 }}
        >
          <TabPane tab={`待发送 (${pendingReminders?.length || 0})`} key="pending" />
          <TabPane tab="已发送" key="sent" />
          <TabPane tab="已完成" key="completed" />
        </Tabs>

        <DataTable
          columns={columns}
          dataSource={tableData}
          loading={isLoading}
          pagination={tablePagination}
          onChange={handleTableChange}
          rowSelection={activeTab === 'pending' ? rowSelection : null}
          rowKey="id"
        />
      </PageContent>

      <ModalForm
        title="发送提醒"
        open={sendModalOpen}
        onCancel={() => setSendModalOpen(false)}
        onFinish={handleSendSubmit}
        loading={sendMutation.isPending}
        okText="发送"
        form={sendForm}
        width={520}
      >
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="提醒日期">
            {selectedReminder ? dayjs(selectedReminder.reminder_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="宠物">
            {selectedReminder ? getPetName(selectedReminder.pet_id) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="主人">
            {selectedReminder ? getOwnerName(selectedReminder.pet_id) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {selectedReminder ? getOwnerPhone(selectedReminder.pet_id) : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Form.Item
          name="sent_by"
          label="发送人"
          rules={[{ required: true, message: '请选择发送人' }]}
        >
          <Select placeholder="请选择发送人">
            {users?.map(user => (
              <Option key={user.id} value={user.id}>{user.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="notes"
          label="备注"
        >
          <TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title="标记完成"
        open={completeModalOpen}
        onCancel={() => setCompleteModalOpen(false)}
        onFinish={handleCompleteSubmit}
        loading={completeMutation.isPending}
        okText="确认完成"
        form={completeForm}
        width={520}
      >
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="提醒日期">
            {selectedReminder ? dayjs(selectedReminder.reminder_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="宠物">
            {selectedReminder ? getPetName(selectedReminder.pet_id) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="主人">
            {selectedReminder ? getOwnerName(selectedReminder.pet_id) : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Form.Item
          name="response"
          label="响应情况"
        >
          <TextArea rows={3} placeholder="请输入客户响应情况" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="备注"
        >
          <TextArea rows={2} placeholder="请输入备注信息" />
        </Form.Item>
      </ModalForm>

      <Modal
        title="提醒详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedReminder && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="提醒日期">
              {dayjs(selectedReminder.reminder_date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {reminderTypeMap[selectedReminder.reminder_type]?.label || selectedReminder.reminder_type}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusBadge type="reminder" status={selectedReminder.status} />
            </Descriptions.Item>
            <Descriptions.Item label="宠物">
              {getPetName(selectedReminder.pet_id)}
            </Descriptions.Item>
            <Descriptions.Item label="主人">
              {getOwnerName(selectedReminder.pet_id)}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {getOwnerPhone(selectedReminder.pet_id)}
            </Descriptions.Item>
            <Descriptions.Item label="相关疫苗">
              {getVaccinationInfo(selectedReminder.vaccination_record_id)}
            </Descriptions.Item>
            {selectedReminder.sent_at && (
              <Descriptions.Item label="发送时间">
                {dayjs(selectedReminder.sent_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {selectedReminder.response && (
              <Descriptions.Item label="响应情况">
                {selectedReminder.response}
              </Descriptions.Item>
            )}
            {selectedReminder.notes && (
              <Descriptions.Item label="备注">
                {selectedReminder.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default RevisitRemindersPage
