import React, { useState, useMemo } from 'react'
import {
  Button,
  Input,
  Select,
  Space,
  Form,
  DatePicker,
  message,
  Row,
  Col,
  Typography,
  Modal,
  Tag,
  Tooltip,
  Divider
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  CheckInOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  FilterOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { appointmentsAPI, petsAPI, usersAPI, vaccinesAPI } from '../../api'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import DataTable, { columnHelper } from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ModalForm from '../../components/common/ModalForm'
import ConfirmDelete from '../../components/common/ConfirmDelete'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const APPOINTMENT_TYPE_MAP = {
  vaccination: { label: '疫苗接种', color: 'blue' },
  recheck: { label: '复诊', color: 'purple' },
  consultation: { label: '问诊', color: 'cyan' },
  surgery: { label: '手术', color: 'red' },
  grooming: { label: '美容', color: 'orange' },
  other: { label: '其他', color: 'default' }
}

const TIME_SLOTS = [
  '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00',
  '11:00-11:30', '11:30-12:00', '14:00-14:30', '14:30-15:00',
  '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00',
  '17:00-17:30', '17:30-18:00'
]

const STATUS_TRANSITIONS = {
  scheduled: ['checked_in', 'cancelled'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: []
}

function AppointmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [cancelForm] = Form.useForm()

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [filterVisible, setFilterVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [cancellingAppointment, setCancellingAppointment] = useState(null)
  const [conflictError, setConflictError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })

  const queryParams = useMemo(() => {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    if (searchText) params.search = searchText
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.appointment_type = typeFilter
    if (dateRange && dateRange.length === 2) {
      params.start_date = dateRange[0].format('YYYY-MM-DD')
      params.end_date = dateRange[1].format('YYYY-MM-DD')
    }
    return params
  }, [searchText, statusFilter, typeFilter, dateRange, pagination])

  const { data: appointmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments', queryParams],
    queryFn: () => appointmentsAPI.getList(queryParams),
    select: (res) => ({
      data: res.data || [],
      total: res.total || 0
    })
  })

  const { data: pets = [] } = useQuery({
    queryKey: ['pets-select'],
    queryFn: () => petsAPI.getList(),
    select: (res) => res.data || []
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => usersAPI.getList(),
    select: (res) => res.data || []
  })

  const { data: vaccines = [] } = useQuery({
    queryKey: ['vaccines-select'],
    queryFn: () => vaccinesAPI.getList(),
    select: (res) => res.data || []
  })

  const checkConflictMutation = useMutation({
    mutationFn: async (values) => {
      const params = {
        date: values.appointment_date.format('YYYY-MM-DD'),
        time_slot: values.time_slot,
        pet_id: values.pet_id
      }
      if (editingAppointment) {
        params.exclude_id = editingAppointment.id
      }
      const res = await appointmentsAPI.getList(params)
      return res.data && res.data.length > 0
    },
    onSuccess: (hasConflict) => {
      if (hasConflict) {
        setConflictError('该时间段已有预约，请选择其他时间')
      } else {
        setConflictError(null)
      }
    }
  })

  const createMutation = useMutation({
    mutationFn: (data) => appointmentsAPI.create(data),
    onSuccess: () => {
      message.success('预约创建成功')
      setModalVisible(false)
      form.resetFields()
      setEditingAppointment(null)
      setConflictError(null)
      queryClient.invalidateQueries(['appointments'])
    },
    onError: (err) => message.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentsAPI.update(id, data),
    onSuccess: () => {
      message.success('预约更新成功')
      setModalVisible(false)
      form.resetFields()
      setEditingAppointment(null)
      setConflictError(null)
      queryClient.invalidateQueries(['appointments'])
    },
    onError: (err) => message.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentsAPI.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries(['appointments'])
    },
    onError: (err) => message.error(err.message)
  })

  const checkInMutation = useMutation({
    mutationFn: (id) => appointmentsAPI.checkIn(id),
    onSuccess: () => {
      message.success('签到成功')
      queryClient.invalidateQueries(['appointments'])
    },
    onError: (err) => message.error(err.message)
  })

  const completeMutation = useMutation({
    mutationFn: (id) => appointmentsAPI.complete(id),
    onSuccess: () => {
      message.success('预约已完成')
      queryClient.invalidateQueries(['appointments'])
    },
    onError: (err) => message.error(err.message)
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentsAPI.cancel(id, data),
    onSuccess: () => {
      message.success('预约已取消')
      setCancelModalVisible(false)
      setCancellingAppointment(null)
      cancelForm.resetFields()
      queryClient.invalidateQueries(['appointments'])
    },
    onError: (err) => message.error(err.message)
  })

  const handleAdd = () => {
    setEditingAppointment(null)
    form.resetFields()
    setConflictError(null)
    setModalVisible(true)
  }

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment)
    setConflictError(null)
    form.setFieldsValue({
      ...appointment,
      appointment_date: appointment.appointment_date ? dayjs(appointment.appointment_date) : null
    })
    setModalVisible(true)
  }

  const handleCheckIn = (id) => {
    checkInMutation.mutate(id)
  }

  const handleComplete = (id) => {
    completeMutation.mutate(id)
  }

  const handleCancel = (appointment) => {
    setCancellingAppointment(appointment)
    cancelForm.resetFields()
    setCancelModalVisible(true)
  }

  const handleCancelSubmit = async () => {
    try {
      const values = await cancelForm.validateFields()
      if (cancellingAppointment) {
        cancelMutation.mutate({ id: cancellingAppointment.id, data: values })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleTimeSlotChange = async (value) => {
    const values = form.getFieldsValue()
    if (values.appointment_date && values.pet_id && value) {
      checkConflictMutation.mutate({
        ...values,
        time_slot: value
      })
    }
  }

  const handleDateChange = async (value) => {
    const values = form.getFieldsValue()
    if (values.time_slot && values.pet_id && value) {
      checkConflictMutation.mutate({
        ...values,
        appointment_date: value
      })
    }
  }

  const handlePetChange = async (value) => {
    const values = form.getFieldsValue()
    if (values.appointment_date && values.time_slot && value) {
      checkConflictMutation.mutate({
        ...values,
        pet_id: value
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (conflictError) {
        message.error('请先解决时间段冲突')
        return
      }
      const data = {
        ...values,
        appointment_date: values.appointment_date.format('YYYY-MM-DD'),
        status: values.status || 'scheduled'
      }
      if (editingAppointment) {
        updateMutation.mutate({ id: editingAppointment.id, data })
      } else {
        createMutation.mutate(data)
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const canTransition = (currentStatus, targetStatus) => {
    return STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus)
  }

  const hasActiveFilters = !!(statusFilter || typeFilter || dateRange || searchText)

  const handleResetFilters = () => {
    setSearchText('')
    setStatusFilter(null)
    setTypeFilter(null)
    setDateRange(null)
  }

  const columns = [
    columnHelper.date('日期', 'appointment_date', 'YYYY-MM-DD', {
      sorter: (a, b) => dayjs(a.appointment_date).valueOf() - dayjs(b.appointment_date).valueOf(),
      width: 120
    }),
    {
      title: '时间段',
      dataIndex: 'time_slot',
      key: 'time_slot',
      width: 120,
      render: (slot) => (
        <Space>
          <CalendarOutlined />
          {slot}
        </Space>
      )
    },
    {
      title: '宠物名称',
      dataIndex: ['pet', 'name'],
      key: 'pet_name',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/pets/${record.pet?.id}`)}
        >
          {record.pet?.name || '-'}
        </Button>
      )
    },
    {
      title: '主人姓名',
      dataIndex: ['pet', 'owner', 'name'],
      key: 'owner_name',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/owners/${record.pet?.owner?.id}`)}
        >
          {record.pet?.owner?.name || '-'}
        </Button>
      )
    },
    {
      title: '主人电话',
      dataIndex: ['pet', 'owner', 'phone'],
      key: 'owner_phone',
      render: (_, record) => record.pet?.owner?.phone || '-'
    },
    {
      title: '预约类型',
      dataIndex: 'appointment_type',
      key: 'appointment_type',
      width: 120,
      render: (type) => {
        const info = APPOINTMENT_TYPE_MAP[type] || APPOINTMENT_TYPE_MAP.other
        return <Tag color={info.color}>{info.label}</Tag>
      },
      filters: Object.entries(APPOINTMENT_TYPE_MAP).map(([value, { label }]) => ({
        text: label, value
      })),
      filteredValue: typeFilter ? [typeFilter] : null,
      onFilter: (value) => setTypeFilter(value)
    },
    {
      title: '疫苗',
      dataIndex: ['vaccine', 'name'],
      key: 'vaccine',
      render: (_, record) => record.vaccine?.name || '-'
    },
    columnHelper.status('状态', 'status', 'appointment', { width: 100 }),
    {
      title: '分配人员',
      dataIndex: ['assigned_user', 'name'],
      key: 'assigned_user',
      render: (_, record) => record.assigned_user?.name || '-'
    },
    columnHelper.actions((_, record) => (
      <Space size="small">
        <Tooltip title="查看详情">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/appointments/${record.id}`)}
          />
        </Tooltip>
        {record.status === 'scheduled' && (
          <Tooltip title="签到">
            <Button
              type="link"
              size="small"
              icon={<CheckInOutlined />}
              onClick={() => handleCheckIn(record.id)}
              loading={checkInMutation.isPending && checkInMutation.variables === record.id}
            />
          </Tooltip>
        )}
        {record.status === 'checked_in' && (
          <Tooltip title="完成">
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleComplete(record.id)}
              loading={completeMutation.isPending && completeMutation.variables === record.id}
            />
          </Tooltip>
        )}
        {canTransition(record.status, 'cancelled') && (
          <Tooltip title="取消">
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancel(record)}
            />
          </Tooltip>
        )}
        {record.status === 'scheduled' && (
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        )}
        {record.status === 'scheduled' && (
          <ConfirmDelete
            title="确认删除预约"
            description="确定要删除这个预约吗？此操作不可撤销。"
            onConfirm={() => deleteMutation.mutate(record.id)}
            loading={deleteMutation.isPending && deleteMutation.variables === record.id}
          />
        )}
      </Space>
    ), { width: 220 })
  ]

  const quickActions = (
    <Space>
      <Button
        icon={<CalendarOutlined />}
        onClick={() => navigate('/appointments/calendar')}
      >
        日历视图
      </Button>
    </Space>
  )

  return (
    <div>
      <PageHeader
        title="预约管理"
        subtitle="管理所有预约记录"
        onAdd={handleAdd}
        addText="新增预约"
        onFilter={() => setFilterVisible(!filterVisible)}
        showFilterButton
        filterActive={hasActiveFilters}
        extra={quickActions}
      />

      <PageContent
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={!appointmentsData?.data?.length}
        emptyDescription="暂无预约记录"
      >
        <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索宠物/主人姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="scheduled">已预约</Option>
            <Option value="checked_in">已签到</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
            <Option value="no_show">未到店</Option>
          </Select>
          <Select
            placeholder="类型筛选"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(APPOINTMENT_TYPE_MAP).map(([value, { label }]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
          {hasActiveFilters && (
            <Button onClick={handleResetFilters}>
              重置筛选
            </Button>
          )}
        </Space>

        <DataTable
          columns={columns}
          dataSource={appointmentsData?.data || []}
          loading={isLoading}
          pagination={{
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: appointmentsData?.total || 0
          }}
          onChange={(page) => setPagination({ ...pagination, page: page.current, pageSize: page.pageSize })}
        />
      </PageContent>

      <ModalForm
        title={editingAppointment ? '编辑预约' : '新增预约'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingAppointment(null)
          form.resetFields()
          setConflictError(null)
        }}
        onFinish={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending || checkConflictMutation.isPending}
        form={form}
        width={700}
      >
        {conflictError && (
          <div style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ff4d4f'
          }}>
            <WarningOutlined />
            {conflictError}
          </div>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pet_id"
              label="宠物"
              rules={[{ required: true, message: '请选择宠物' }]}
            >
              <Select
                placeholder="请选择宠物"
                showSearch
                optionFilterProp="children"
                onChange={handlePetChange}
              >
                {pets.map((pet) => (
                  <Option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species === 'dog' ? '犬' : pet.species === 'cat' ? '猫' : '其他'} - {pet.owner?.name || '未知主人'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="appointment_type"
              label="预约类型"
              rules={[{ required: true, message: '请选择预约类型' }]}
            >
              <Select placeholder="请选择预约类型">
                {Object.entries(APPOINTMENT_TYPE_MAP).map(([value, { label }]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="appointment_date"
              label="预约日期"
              rules={[{ required: true, message: '请选择预约日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择预约日期"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                onChange={handleDateChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="time_slot"
              label="时间段"
              rules={[{ required: true, message: '请选择时间段' }]}
            >
              <Select
                placeholder="请选择时间段"
                onChange={handleTimeSlotChange}
              >
                {TIME_SLOTS.map((slot) => (
                  <Option key={slot} value={slot}>{slot}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vaccine_id"
              label="疫苗"
            >
              <Select placeholder="请选择疫苗（疫苗接种时必填）">
                {vaccines.map((vaccine) => (
                  <Option key={vaccine.id} value={vaccine.id}>
                    {vaccine.name} - {vaccine.species === 'dog' ? '犬' : vaccine.species === 'cat' ? '猫' : '通用'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="assigned_user_id"
              label="分配人员"
            >
              <Select placeholder="请选择分配人员" showSearch optionFilterProp="children">
                {users.map((user) => (
                  <Option key={user.id} value={user.id}>
                    {user.name} ({user.role || '员工'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="status"
          label="状态"
          initialValue="scheduled"
        >
          <Select placeholder="请选择状态">
            <Option value="scheduled">已预约</Option>
            <Option value="checked_in">已签到</Option>
            <Option value="completed">已完成</Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </ModalForm>

      <Modal
        title="取消预约"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false)
          setCancellingAppointment(null)
          cancelForm.resetFields()
        }}
        onOk={handleCancelSubmit}
        confirmLoading={cancelMutation.isPending}
        okText="确认取消"
        cancelText="返回"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Form form={cancelForm} layout="vertical">
          <div style={{ marginBottom: 16, padding: '12px', background: '#fff2f0', borderRadius: '6px' }}>
            <Text type="danger">
              <WarningOutlined style={{ marginRight: 8 }} />
              您确定要取消这个预约吗？此操作不可撤销。
            </Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">预约信息：</Text>
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: '4px 0' }}>
                <strong>宠物：</strong>{cancellingAppointment?.pet?.name}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>日期：</strong>{cancellingAppointment?.appointment_date ? dayjs(cancellingAppointment.appointment_date).format('YYYY-MM-DD') : '-'}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>时间：</strong>{cancellingAppointment?.time_slot}
              </p>
            </div>
          </div>
          <Form.Item
            name="cancel_reason"
            label="取消原因"
            rules={[{ required: true, message: '请输入取消原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入取消原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppointmentsPage
