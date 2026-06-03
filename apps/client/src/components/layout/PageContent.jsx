import React from 'react'
import { Spin, Empty, Result, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

export default function PageContent({
  loading = false,
  error = null,
  empty = false,
  emptyDescription = '暂无数据',
  errorDescription = '加载失败，请稍后重试',
  onRetry,
  children,
  padding = 24,
  minHeight = 400
}) {
  if (loading) {
    return (
