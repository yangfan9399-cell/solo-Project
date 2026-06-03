import React, { useState, useMemo } from 'react'
import {
  Button,
  Input,
  Space,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Tabs,
  Progress,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Card
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { vaccineBatchesAPI, vaccinesAPI } from '../../api'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import DataTable, { columnHelper } from '../../components/common/DataTable'
import ModalForm from '../../components/common/ModalForm'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDelete from '../../components/common/ConfirmDelete'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const LOW_STOCK_THRESHOLD = 10
const EXPIRING_DAYS = 30

function VaccineBatchesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [form] = Form.useForm()

  const { data: vaccinesData } = useQuery({
    queryKey: ['vaccines'],
    queryFn: () => vaccinesAPI.getList(),
    select: (res) => res?.items || []
  })

  const queryParams = useMemo(() => {
    const params = {}
    if (searchText) {
      params.batch_no_like = searchText
    }
    if (statusFilter) {
      params.status = statusFilter
    }
    if (dateRange && dateRange.length === 2) {
      params.expiry_date_gte = dateRange[0].format('YYYY-MM-DD')
      params.expiry_date_lte = dateRange[1].format('YYYY-MM-DD')
    }
    return params
  }, [searchText, statusFilter, dateRange])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vaccineBatches', queryParams],
    queryFn: () => vaccineBatchesAPI.getList(queryParams),
    select: (res) => res
  })

  const { data: expiringData } = useQuery({
    queryKey: ['vaccineBatchesExpiring'],
    queryFn: () => vaccineBatchesAPI.getExpiring(),
    select: (res) => res?.items || []
  })

  const { data: availableData } = useQuery({
    queryKey: ['vaccineBatchesAvailable'],
    queryFn: () => vaccineBatchesAPI.getAvailable(),
    select: (res) => res?.items || []
  })

  const createMutation = useMutation({
    mutationFn: (data) => vaccineBatchesAPI.create(data),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries(['vaccineBatches'])
      queryClient.invalidateQueries(['vaccineBatchesExpiring'])
      queryClient.invalidateQueries(['vaccineBatchesAvailable'])
      queryClient.invalidateQueries(['vaccines'])
    },
    onError: (err) => message.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vaccineBatchesAPI.update(id, data),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingBatch(null)
      form.resetFields()
      queryClient.invalidateQueries(['vaccineBatches'])
      queryClient.invalidateQueries(['vaccineBatchesExpiring'])
      queryClient.invalidateQueries(['vaccineBatchesAvailable'])
      queryClient.invalidateQueries(['vaccines'])
    },
    onError: (err) => message.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => vaccineBatchesAPI.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries(['vaccineBatches'])
      queryClient.invalidateQueries(['vaccineBatchesExpiring'])
      queryClient.invalidateQueries(['vaccineBatchesAvailable'])
      queryClient.invalidateQueries(['vaccines'])
    },
    onError: (err) => message.error(err.message)
  })

  const handleAdd = () => {
    setEditingBatch(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (batch) => {
    setEditingBatch(batch)
    form.setFieldsValue({
      ...batch,
      manufacture_date: batch.manufacture_date ? dayjs(batch.manufacture_date) : null,
      expiry_date: batch.expiry_date ? dayjs(batch.expiry_date) : null
    })
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = async (values) => {
    const formattedValues = {
      ...values,
      manufacture_date: values.manufacture_date?.format('YYYY-MM-DD'),
      expiry_date: values.expiry_date?.format('YYYY-MM-DD')
    }

    if (editingBatch) {
      updateMutation.mutate({ id: editingBatch.id, data: formattedValues })
    } else {
      createMutation.mutate(formattedValues)
    }
  }

  const isExpired = (expiryDate) => {
    return dayjs(expiryDate).isBefore(dayjs(), 'day')
  }

  const isExpiringSoon = (expiryDate) => {
    const today = dayjs()
    const expiry = dayjs(expiryDate)
    return expiry.isAfter(today) && expiry.diff(today, 'day') <= EXPIRING_DAYS
  }

  const getRowClassName = (record) => {
    if (record.status === 'expired' || isExpired(record.expiry_date)) {
      return 'row-expired'
    }
    if (record.status === 'normal' && isExpiringSoon(record.expiry_date)) {
      return 'row-expiring'
    }
    return ''
  }

  const getDisplayData = () => {
    let items = []
    let pagination = null

    if (activeTab === 'all') {
      items = data?.items || []
      pagination = data?.pagination ? {
        page: data.pagination.page,
        pageSize: data.pagination.pageSize,
        total: data.pagination.total
      } : null
    } else if (activeTab === 'expiring') {
      items = expiringData || []
    } else if (activeTab === 'lowStock') {
      items = availableData?.filter(
        (item) => item.available_quantity < LOW_STOCK_THRESHOLD
      ) || []
    }

    return { items, pagination }
  }

  const { items: displayItems, pagination: displayPagination } = getDisplayData()

  const lowStockCount = availableData?.filter(
    (item) => item.available_quantity < LOW_STOCK_THRESHOLD
  ).length || 0

  const columns = [
    columnHelper.text('批次号', 'batch_no', {
      render: (text, record) => {
        const expired = record.status === 'expired' || isExpired(record.expiry_date)
        const expiring = record.status === 'normal' && isExpiringSoon(record.expiry_date)
        return (
          <Space>
            {(expired || expiring) && (
              <WarningOutlined style={{ color: expired ? '#ff4d4f' : '#faad14' }} />
            )}
            <span style={{
              color: expired ? '#ff4d4f' : expiring ? '#faad14' : 'inherit',
              fontWeight: expired || expiring ? 'bold' : 'normal'
            }}>
              {text}
            </span>
          </Space>
        )
      }
    }),
    columnHelper.text('疫苗名称', 'vaccine_name', {
      render: (text) => text || '-'
    }),
    columnHelper.date('生产日期', 'manufacture_date'),
    {
      title: '有效期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (value, record) => {
        if (!value) return '-'
        const expired = record.status === 'expired' || isExpired(value)
        const expiring = record.status === 'normal' && isExpiringSoon(value)
        const color = expired ? '#ff4d4f' : expiring ? '#faad14' : 'inherit'
        return (
          <Space>
            <ClockCircleOutlined style={{ color }} />
            <span style={{ color, fontWeight: expired || expiring ? 'bold' : 'normal' }}>
              {dayjs(value).format('YYYY-MM-DD')}
            </span>
            {expired && <Tag color="red">已过期</Tag>}
            {expiring && <Tag color="orange">即将过期</Tag>}
          </Space>
        )
      }
    },
    columnHelper.text('总数量', 'quantity', {
      render: (value) => `${value || 0} 剂`
    }),
    columnHelper.text('已用数量', 'used_quantity', {
      render: (value) => `${value || 0} 剂`
    }),
    {
      title: '可用数量',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      render: (_, record) => {
        const available = record.quantity - record.used_quantity
        const isLow = available < LOW_STOCK_THRESHOLD
        return (
          <Tag color={isLow ? 'warning' : 'green'}>
            {available} 剂
          </Tag>
        )
      }
    },
    {
      title: '库存使用',
      key: 'usage_progress',
      render: (_, record) => {
        const total = record.quantity || 0
        const used = record.used_quantity || 0
        const percent = total > 0 ? Math.round((used / total) * 100) : 0
        const available = total - used
        const isLow = available < LOW_STOCK_THRESHOLD
        const isExpired = record.status === 'expired' || isExpired(record.expiry_date)
        const strokeColor = isExpired ? '#ff4d4f' : isLow ? '#faad14' : '#52c41a'

        return (
          <div style={{ minWidth: 120 }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={strokeColor}
              format={() => `${used}/${total}`}
            />
          </div>
        )
      }
    },
    columnHelper.status('状态', 'status', 'batch'),
    columnHelper.text('单价', 'unit_price', {
      render: (value) => value ? `¥${value.toFixed(2)}` : '-'
    }),
    columnHelper.actions((_, record) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
        <ConfirmDelete
          title="确认删除该批次？"
          description="删除后将无法恢复，如果该批次有关联接种记录则无法删除。"
          onConfirm={() => handleDelete(record.id)}
          loading={deleteMutation.isPending}
        />
      </Space>
    ), { width: 180 })
  ]

  const statusOptions = [
    { value: 'normal', label: '正常' },
    { value: 'quarantine', label: '隔离' },
    { value: 'recalled', label: '已召回' },
    { value: 'expired', label: '已过期' }
  ]

  const tabItems = [
    {
      key: 'all',
      label: '全部批次',
      children: (
        <PageContent
          loading={isLoading}
          error={error}
          empty={!isLoading && displayItems.length === 0}
          onRetry={refetch}
        >
          <Space style={{ marginBottom: 16 }} wrap>
            <Search
              placeholder="搜索批次号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            <RangePicker
              placeholder={['有效期开始', '有效期结束']}
              value={dateRange}
              onChange={setDateRange}
              allowClear
            />
          </Space>

          <DataTable
            columns={columns}
            dataSource={displayItems}
            loading={isLoading}
            pagination={displayPagination}
            rowKey="id"
            rowClassName={getRowClassName}
          />
        </PageContent>
      )
    },
    {
      key: 'expiring',
      label: `即将过期 (${expiringData?.length || 0})`,
      children: (
        <PageContent
          loading={isLoading}
          error={error}
          empty={!isLoading && displayItems.length === 0}
          emptyDescription={`未来 ${EXPIRING_DAYS} 天内没有即将过期的疫苗批次`}
          onRetry={refetch}
        >
          <DataTable
            columns={columns}
            dataSource={displayItems}
            loading={isLoading}
            rowKey="id"
            rowClassName={getRowClassName}
          />
        </PageContent>
      )
    },
    {
      key: 'lowStock',
      label: `低库存 (${lowStockCount})`,
      children: (
        <PageContent
          loading={isLoading}
          error={error}
          empty={!isLoading && displayItems.length === 0}
          emptyDescription="没有库存不足的疫苗批次"
          onRetry={refetch}
        >
          <DataTable
            columns={columns}
            dataSource={displayItems}
            loading={isLoading}
            rowKey="id"
            rowClassName={getRowClassName}
          />
        </PageContent>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        title="疫苗批次管理"
        subtitle="管理疫苗批次信息、库存及有效期"
        onAdd={handleAdd}
        addText="添加批次"
        extra={
          <Button
            type="default"
            icon={<InboxOutlined />}
            onClick={() => navigate('/vaccines')}
          >
            疫苗列表
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总批次"
              value={data?.pagination?.total || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="即将过期"
              value={expiringData?.length || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="低库存"
              value={lowStockCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="可用库存"
              value={availableData?.reduce((sum, item) => sum + (item.available_quantity || 0), 0) || 0}
              suffix="剂"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ background: '#fff', padding: '0 24px', borderRadius: 8 }}
      />

      <ModalForm
        title={editingBatch ? '编辑疫苗批次' : '添加疫苗批次'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingBatch(null)
          form.resetFields()
        }}
        onFinish={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialValues={editingBatch}
        width={700}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vaccine_id"
              label="疫苗"
              rules={[{ required: true, message: '请选择疫苗' }]}
            >
              <Select placeholder="请选择疫苗">
                {vaccinesData.map((vaccine) => (
                  <Option key={vaccine.id} value={vaccine.id}>
                    {vaccine.name} ({vaccine.type})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="batch_no"
              label="批次号"
              rules={[{ required: true, message: '请输入批次号' }]}
            >
              <Input placeholder="请输入批次号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="manufacture_date"
              label="生产日期"
              rules={[{ required: true, message: '请选择生产日期' }]}
            >
              <DatePicker
                placeholder="请选择生产日期"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="expiry_date"
              label="有效期"
              rules={[{ required: true, message: '请选择有效期' }]}
            >
              <DatePicker
                placeholder="请选择有效期"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="quantity"
              label="总数量"
              rules={[
                { required: true, message: '请输入总数量' },
                { type: 'number', min: 0, message: '数量不能为负数' }
              ]}
            >
              <InputNumber
                placeholder="总数量"
                min={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="used_quantity"
              label="已用数量"
              rules={[{ type: 'number', min: 0, message: '已用数量不能为负数' }]}
            >
              <InputNumber
                placeholder="已用数量"
                min={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="unit_price"
              label="单价 (元)"
              rules={[{ type: 'number', min: 0, message: '单价必须为正数' }]}
            >
              <InputNumber
                placeholder="单价"
                min={0}
                step={0.01}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="supplier" label="供应商">
              <Input placeholder="请输入供应商" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lot_number" label="批号">
              <Input placeholder="请输入批号" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态">
            {statusOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>
      </ModalForm>

      <style>{`
        .row-expired {
          background-color: #fff1f0 !important;
        }
        .row-expiring {
          background-color: #fffbe6 !important;
        }
        .row-expired:hover > td {
          background-color: #fff1f0 !important;
        }
        .row-expiring:hover > td {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </div>
  )
}

export default VaccineBatchesPage
