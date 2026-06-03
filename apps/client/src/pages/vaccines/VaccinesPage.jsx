import React, { useState } from 'react'
import {
  Button,
  Input,
  Space,
  Form,
  Select,
  InputNumber,
  Tag,
  message,
  Alert
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  WarningOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { vaccinesAPI } from '../../api'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import DataTable, { columnHelper } from '../../components/common/DataTable'
import ModalForm from '../../components/common/ModalForm'
import ConfirmDelete from '../../components/common/ConfirmDelete'

const { Search } = Input
const { Option } = Select
const LOW_STOCK_THRESHOLD = 10

function VaccinesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingVaccine, setEditingVaccine] = useState(null)
  const [form] = Form.useForm()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vaccines', { name_like: searchText, type: typeFilter }],
    queryFn: () => vaccinesAPI.getList({ name_like: searchText, type: typeFilter }),
    select: (res) => res
  })

  const createMutation = useMutation({
    mutationFn: (data) => vaccinesAPI.create(data),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries(['vaccines'])
    },
    onError: (err) => message.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vaccinesAPI.update(id, data),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingVaccine(null)
      form.resetFields()
      queryClient.invalidateQueries(['vaccines'])
    },
    onError: (err) => message.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => vaccinesAPI.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries(['vaccines'])
    },
    onError: (err) => message.error(err.message)
  })

  const handleAdd = () => {
    setEditingVaccine(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (vaccine) => {
    setEditingVaccine(vaccine)
    form.setFieldsValue(vaccine)
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = async (values) => {
    if (editingVaccine) {
      updateMutation.mutate({ id: editingVaccine.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const lowStockVaccines = data?.items?.filter(
    (v) => (v.total_quantity - v.used_quantity) < LOW_STOCK_THRESHOLD
  ) || []

  const columns = [
    columnHelper.text('疫苗名称', 'name', {
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/vaccines/${record.id}`)}
        >
          {text}
        </Button>
      )
    }),
    columnHelper.text('生产厂家', 'manufacturer', {
      render: (text) => text || '-'
    }),
    columnHelper.text('疫苗类型', 'type', {
      render: (text) => text || '-'
    }),
    columnHelper.text('剂量体积', 'dose_volume', {
      render: (value) => value ? `${value} ml` : '-'
    }),
    columnHelper.text('适用物种', 'applicable_species', {
      render: (text) => text || '-'
    }),
    columnHelper.text('间隔天数', 'interval_days', {
      render: (value) => value ? `${value} 天` : '-'
    }),
    columnHelper.text('总批次', 'batch_count', {
      render: (value) => value || 0
    }),
    {
      title: '可用库存',
      dataIndex: 'available_stock',
      key: 'available_stock',
      render: (_, record) => {
        const available = (record.total_quantity || 0) - (record.used_quantity || 0)
        const isLow = available < LOW_STOCK_THRESHOLD
        return (
          <Space>
            {isLow && <WarningOutlined style={{ color: '#faad14' }} />}
            <Tag color={isLow ? 'warning' : 'green'}>
              {available} 剂
            </Tag>
          </Space>
        )
      }
    },
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
          title="确认删除该疫苗？"
          description="删除后将无法恢复，如果该疫苗有关联批次则无法删除。"
          onConfirm={() => handleDelete(record.id)}
          loading={deleteMutation.isPending}
        />
      </Space>
    ))
  ]

  const vaccines = data?.items || []
  const pagination = data?.pagination ? {
    page: data.pagination.page,
    pageSize: data.pagination.pageSize,
    total: data.pagination.total
  } : null

  const vaccineTypes = ['灭活疫苗', '减毒活疫苗', '重组疫苗', '亚单位疫苗', '联合疫苗']
  const speciesOptions = ['犬', '猫', '犬猫通用', '兔', '其他']

  return (
    <div>
      <PageHeader
        title="疫苗管理"
        subtitle="管理宠物医院的疫苗信息及库存"
        onAdd={handleAdd}
        addText="添加疫苗"
        extra={
          <Button
            type="default"
            icon={<InboxOutlined />}
            onClick={() => navigate('/vaccines/batches')}
          >
            批次管理
          </Button>
        }
      />

      {lowStockVaccines.length > 0 && (
        <Alert
          message="库存预警"
          description={`有 ${lowStockVaccines.length} 种疫苗库存不足 ${LOW_STOCK_THRESHOLD} 剂，请及时补充。`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <PageContent
        loading={isLoading}
        error={error}
        empty={!isLoading && vaccines.length === 0}
        onRetry={refetch}
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="搜索疫苗名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="筛选疫苗类型"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 200 }}
            allowClear
          >
            {vaccineTypes.map((type) => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Space>

        <DataTable
          columns={columns}
          dataSource={vaccines}
          loading={isLoading}
          pagination={pagination}
          rowKey="id"
        />
      </PageContent>

      <ModalForm
        title={editingVaccine ? '编辑疫苗' : '添加疫苗'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingVaccine(null)
          form.resetFields()
        }}
        onFinish={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialValues={editingVaccine}
        width={600}
      >
        <Form.Item
          name="name"
          label="疫苗名称"
          rules={[{ required: true, message: '请输入疫苗名称' }]}
        >
          <Input placeholder="请输入疫苗名称" />
        </Form.Item>

        <Form.Item
          name="type"
          label="疫苗类型"
          rules={[{ required: true, message: '请选择疫苗类型' }]}
        >
          <Select placeholder="请选择疫苗类型">
            {vaccineTypes.map((type) => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="manufacturer" label="生产厂家">
          <Input placeholder="请输入生产厂家" />
        </Form.Item>

        <Form.Item
          name="dose_volume"
          label="剂量体积 (ml)"
          rules={[{ type: 'number', min: 0, message: '剂量必须为正数' }]}
        >
          <InputNumber
            placeholder="请输入剂量体积"
            min={0}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="applicable_species" label="适用物种">
          <Select placeholder="请选择适用物种">
            {speciesOptions.map((species) => (
              <Option key={species} value={species}>{species}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="interval_days"
          label="免疫间隔天数"
          rules={[{ type: 'number', min: 0, message: '间隔天数不能为负数' }]}
        >
          <InputNumber
            placeholder="请输入间隔天数"
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="booster_doses"
          label="加强针次数"
          rules={[{ type: 'number', min: 0, message: '加强针次数不能为负数' }]}
        >
          <InputNumber
            placeholder="请输入加强针次数"
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="storage_condition" label="储存条件">
          <Input placeholder="如：2-8°C 冷藏" />
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>
      </ModalForm>
    </div>
  )
}

export default VaccinesPage
