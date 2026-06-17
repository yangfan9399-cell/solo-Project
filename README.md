# 石窟壁画颜料病害观察系统

面向石窟保护专业领域的全栈工具，用于高精度壁画图像的病害标注、年度变化对比分析和数据导出。

## 功能特性

- **高精度图标注工作台**：支持缩放、平移、矩形框选标注
- **病害类型体系**：起甲、酥碱、变色、裂隙、其他五大类，每类三级严重程度
- **尺度尺标记**：支持在图像上添加比例尺，自动换算实际面积
- **版本历史管理**：按年度组织普查/复查/专项记录批次
- **年度变化对比**：多版本并排对比、统计对比、变化率分析
- **项目台账**：统一管理所有石窟壁画保护项目
- **筛选检索**：按状态、朝代、异常等多维度筛选
- **数据导出**：摘要报告、CSV、JSON 三种格式
- **异常数据提示**：自动识别温度/湿度异常和重度病害聚集

## 快速开始

### 安装依赖

```bash
bin/setup
```

### 初始化数据

项目内置样例记录、导出结果和版本数据，运行：

```bash
bin/rails db:seed
```

### 启动开发服务器

```bash
bin/dev
```

访问 http://localhost:3000 即可使用。

## 技术栈

- Ruby on Rails 8
- Hotwire (Turbo + Stimulus)
- Tailwind CSS
- SQLite (可切换至 PostgreSQL)
- Active Storage (图像存储)

## 项目结构

```
app/
├── models/
│   ├── project.rb          # 项目
│   ├── record.rb           # 记录批次
│   ├── annotation.rb       # 病害标注
│   ├── scale_marker.rb     # 尺度标记
│   └── export.rb           # 导出记录
├── controllers/
│   ├── projects_controller.rb
│   ├── records_controller.rb
│   ├── annotations_controller.rb
│   ├── scale_markers_controller.rb
│   └── exports_controller.rb
├── views/
│   ├── projects/           # 项目台账、详情、历史、对比
│   ├── records/            # 记录详情、编辑器
│   └── exports/            # 导出列表、详情
└── javascript/controllers/
    └── annotation_editor_controller.js  # 标注工作台交互
```
