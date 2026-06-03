import React, { useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Tag,
  Typography,
  Divider,
  Descriptions,
  Alert,
  List
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  SafetyOutlined,
  SyringeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  checkinsAPI,
  vaccinationsAPI,
  vaccineBatchesAPI,
  usersAPI
} from '../../api'
import StatusBadge from '../../components/common/StatusBadge'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const severityColorMap = {
  mild: 'gold',
  moderate: 'orange',
  severe: 'red'
}

const severityLabelMap = {
  mild: '轻微',
  moderate: '中度',
  severe: '严重'
}

const contraindicationTypeMap = {
  allergy: '过敏',
  illness: '疾病',
  pregnancy: '怀孕',
  immunocompromised: '免疫低下',
  other: '其他'
}

function CheckinsPage() {
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [contraindicationsModalVisible, setContraindicationsModalVisible] = useState(false)
  const [vaccinationModalVisible, setVaccinationModalVisible] = useState(false)
  const [selectedCheckin, setSelectedCheckin] = useState(null)
  const [contraindicationsData, setContraindicationsData] = useState(null)
  const [vaccinationForm] = Form.useForm()

  const { data: checkinsData, isLoading, error, refetch } = useQuery({
    queryKey: ['checkins', { pet_name: searchText, owner_name: searchText }],
    queryFn: () => checkinsAPI.getList({ pet_name: searchText, owner_name: searchText }),
    select: (res) => res.data || []
  })

  const { data: availableBatches } = useQuery({
    queryKey: ['vaccineBatches', 'available'],
    queryFn: () => vaccineBatchesAPI.getAvailable(),
    select: (res) => res.data || [],
    enabled: vaccinationModalVisible
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getList(),
    select: (res) => res.data || [],
    enabled: vaccinationModalVisible
  })

  const createVaccinationMutation = useMutation({
    mutationFn: (data) => vaccinationsAPI.create(data),
    onSuccess: () => {
      message.success('疫苗接种记录已创建')
      setVaccinationModalVisible(false)
      vaccinationForm.resetFields()
      setSelectedCheckin(null)
      queryClient.invalidateQueries(['vaccinations'])
    },
    onError: (err) => message.error(err.message)
  })

  const handleViewDetail = (checkin) => {
    setSelectedCheckin(checkin)
    setDetailModalVisible(true)
  }

  const handleCheckContraindications = async (checkin) => {
    setSelectedCheckin(checkin)
    try {
      const res = await checkinsAPI.getContraindicationsCheck(checkin.id)
      setContraindicationsData(res.data)
      setContraindicationsModalVisible(true)
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleRecordVaccination = (checkin) => {
    setSelectedCheckin(checkin)
    vaccinationForm.resetFields()
    vaccinationForm.setFieldsValue({
      administration_date: dayjs(),
      administration_site: 'subcutaneous',
      given_by: users?.[0]?.id
    })
    setVaccinationModalVisible(true)
  }

  const handleVaccinationSubmit = async () => {
    try {
      const values = await vaccinationForm.validateFields()
      const selectedBatch = availableBatches?.find(b => b.id === values.vaccine_batch_id)

      const data = {
        appointment_id: selectedCheckin.appointment_id,
        checkin_id: selectedCheckin.id,
        pet_id: selectedCheckin.pet_id,
        vaccine_batch_id: values.vaccine_batch_id,
        vaccine_id: selectedBatch?.vaccine_id,
        administration_date: values.administration_date.format('YYYY-MM-DD HH:mm:ss'),
        administration_site: values.administration_site,
        dose_volume: values.dose_volume,
        given_by: values.given_by,
        next_due_date: values.next_due_date ? values.next_due_date.format('YYYY-MM-DD') : null,
        notes: values.notes
      }

      createVaccinationMutation.mutate(data)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleBatchChange = (batchId) => {
    const batch = availableBatches?.find(b => b.id === batchId)
    if (batch) {
      vaccinationForm.setFieldsValue({
        dose_volume: batch.dose_volume
      })
    }
  }

  const columns = [
    {
      title: '签到时间',
      dataIndex: 'checkin_time',
      key: 'checkin_time',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
      sorter: (a, b) => dayjs(a.checkin_time).valueOf() - dayjs(b.checkin_time).valueOf(),
      defaultSortOrder: 'descend'
    },
    {
      title: '宠物名称',
      dataIndex: 'pet_name',
      key: 'pet_name',
      render: (text) => text || '-'
    },
    {
      title: '主人姓名',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (text) => text || '-'
    },
    {
      title: '体温 (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (temp) => temp ? `${temp}°C` : '-',
      align: 'center'
    },
    {
      title: '体重 (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => weight ? `${weight} kg` : '-',
      align: 'center'
    },
    {
      title: '心率 (次/分)',
      dataIndex: 'heart_rate',
      key: 'heart_rate',
      render: (rate) => rate || '-',
      align: 'center'
    },
    {
      title: '呼吸频率 (次/分)',
      dataIndex: 'respiratory_rate',
      key: 'respiratory_rate',
      render: (rate) => rate || '-',
      align: 'center'
    },
    {
      title: '总体状况',
      dataIndex: 'general_condition',
      key: 'general_condition',
      render: (condition) => condition || '-',
      ellipsis: true
    },
    {
      title: '检查人员',
      dataIndex: 'checked_by_name',
      key: 'checked_by_name',
      render: (name) => name || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handleCheckContraindications(record)}
          >
            禁忌症检查
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SyringeOutlined />}
            onClick={() => handleRecordVaccination(record)}
          >
            记录接种
          </Button>
        </Space>
      )
    }
  ]

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={4} type="danger">加载失败</Title>
        <p>{error.message}</p>
        <Button onClick={() => refetch()}>重试</Button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>签到记录</Title>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索宠物名称或主人姓名"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>

      <Table
        columns={columns}
        dataSource={checkinsData}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        locale={{
          emptyText: '暂无签到记录'
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="签到详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedCheckin(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false)
              setSelectedCheckin(null)
            }}
          >
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedCheckin && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="签到时间" span={2}>
              {selectedCheckin.checkin_time ? dayjs(selectedCheckin.checkin_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="宠物名称">
              {selectedCheckin.pet_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="主人姓名">
              {selectedCheckin.owner_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="体温">
              {selectedCheckin.temperature ? `${selectedCheckin.temperature}°C` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="体重">
              {selectedCheckin.weight ? `${selectedCheckin.weight} kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="心率">
              {selectedCheckin.heart_rate ? `${selectedCheckin.heart_rate} 次/分` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="呼吸频率">
              {selectedCheckin.respiratory_rate ? `${selectedCheckin.respiratory_rate} 次/分` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总体状况" span={2}>
              {selectedCheckin.general_condition || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="检查人员" span={2}>
              {selectedCheckin.checked_by_name || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <SafetyOutlined />
            <span>禁忌症检查结果</span>
          </Space>
        }
        open={contraindicationsModalVisible}
        onCancel={() => {
          setContraindicationsModalVisible(false)
          setContraindicationsData(null)
          setSelectedCheckin(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setContraindicationsModalVisible(false)
              setContraindicationsData(null)
              setSelectedCheckin(null)
            }}
          >
            关闭
          </Button>
        ]}
        width={650}
      >
        {contraindicationsData && (
          <div>
            {contraindicationsData.has_active ? (
              <Alert
                message={contraindicationsData.has_severe ? '存在严重禁忌症！' : '存在活跃禁忌症'}
                description={contraindicationsData.warnings}
                type={contraindicationsData.has_severe ? 'error' : 'warning'}
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message="未发现活跃禁忌症"
                description="该宠物目前没有活跃的禁忌症，可以进行常规操作。"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {contraindicationsData.active_contraindications?.length > 0 && (
              <>
                <Divider orientation="left" style={{ margin: '16px 0' }}>
                  禁忌症列表
                </Divider>
                <List
                  dataSource={contraindicationsData.active_contraindications}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={severityColorMap[item.severity]}>
                              {severityLabelMap[item.severity]}
                            </Tag>
                            <Tag color="blue">
                              {contraindicationTypeMap[item.type] || item.type}
                            </Tag>
                            <Text strong>{item.description}</Text>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">
                              记录时间: {item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD') : '-'}
                            </Text>
                            {item.onset_date && (
                              <Text type="secondary">
                                发病时间: {dayjs(item.onset_date).format('YYYY-MM-DD')}
                              </Text>
                            )}
                            {item.noted_by_name && (
                              <Text type="secondary">
                                记录人员: {item.noted_by_name}
                              </Text>
                            )}
                            {item.notes && (
                              <Text type="secondary">
                                备注: {item.notes}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <SyringeOutlined />
            <span>记录疫苗接种</span>
          </Space>
        }
        open={vaccinationModalVisible}
        onCancel={() => {
          setVaccinationModalVisible(false)
          setSelectedCheckin(null)
          vaccinationForm.resetFields()
        }}
        onOk={handleVaccinationSubmit}
        confirmLoading={createVaccinationMutation.isPending}
        okText="确认接种"
        cancelText="取消"
        width={600}
      >
        {selectedCheckin && (
          <Alert
            message={`为 ${selectedCheckin.pet_name} 记录接种`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={vaccinationForm}
          layout="vertical"
        >
          <Form.Item
            name="vaccine_batch_id"
            label="疫苗批次"
            rules={[{ required: true, message: '请选择疫苗批次' }]}
          >
            <Select
              placeholder="请选择可用的疫苗批次"
              showSearch
              optionFilterProp="children"
              onChange={handleBatchChange}
            >
              {availableBatches?.map((batch) => (
                <Option key={batch.id} value={batch.id}>
                  <Space>
                    <span>{batch.vaccine_name}</span>
                    <Tag color="green">{batch.batch_no}</Tag>
                    <Text type="secondary">
                      库存: {batch.quantity - batch.used_quantity}/{batch.quantity}
                    </Text>
                    <StatusBadge type="batch" status={batch.status} />
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="administration_date"
            label="接种时间"
            rules={[{ required: true, message: '请选择接种时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择接种时间"
            />
          </Form.Item>

          <Form.Item
            name="administration_site"
            label="接种部位"
            rules={[{ required: true, message: '请选择接种部位' }]}
          >
            <Select placeholder="请选择接种部位">
              <Option value="subcutaneous">皮下注射</Option>
              <Option value="intramuscular">肌肉注射</Option>
              <Option value="intranasal">鼻腔给药</Option>
              <Option value="oral">口服</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dose_volume"
            label="接种剂量 (ml)"
            rules={[{ required: true, message: '请输入接种剂量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入接种剂量"
              min="0"
              step="0.1"
            />
          </Form.Item>

          <Form.Item
            name="given_by"
            label="接种人员"
            rules={[{ required: true, message: '请选择接种人员' }]}
          >
            <Select placeholder="请选择接种人员" showSearch optionFilterProp="children">
              {users?.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'director' ? '医师' : user.role === 'assistant' ? '助理' : '前台'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="next_due_date"
            label="下次到期日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="留空则根据疫苗间隔自动计算"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CheckinsPage
