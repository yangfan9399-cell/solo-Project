# 📞 手摇电话交换台接线游戏

一款基于 Astro + TypeScript + React Islands 的全栈接线游戏。

## 游戏玩法

- **来电接线**：点击等待中的来电，再点击可用分机完成接通
- **分机占线**：分机在通话期间处于忙碌状态，自动释放
- **插话处理**：紧急来电可打断当前通话（有扣分惩罚）
- **紧急优先级**：四级优先级（紧急/重要/普通/低），紧急来电优先处理
- **班次评分**：基于接通速度、优先级、效率的评分系统

## 运行命令

```bash
pnpm install    # 安装依赖
pnpm run dev    # 启动开发服务器
pnpm run build  # 构建生产版本
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── CallCard.tsx     # 来电卡片
│   ├── ExtensionCard.tsx # 分机卡片
│   ├── ScoreBoard.tsx   # 计分板
│   ├── ActionHistory.tsx # 操作历史
│   ├── LevelSelector.tsx # 关卡选择
│   ├── PlayerProfile.tsx # 玩家档案
│   ├── ShiftSummary.tsx  # 班次结算
│   └── GameBoard.tsx    # 游戏主界面
├── store/
│   └── gameStore.ts     # Zustand 状态管理
├── types/
│   └── game.ts          # TypeScript 类型定义
├── data/
│   └── mockData.ts      # 初始化数据
├── pages/
│   ├── api/
│   │   ├── player.ts       # 玩家档案 API
│   │   ├── game-state.ts   # 游戏状态 API
│   │   └── calculate-score.ts # 分数计算 API
│   └── index.astro
└── styles/
    └── global.css       # Tailwind CSS
```

## 核心特性

- 本地玩家档案存储
- 5个难度关卡系统
- 可恢复的操作历史
- 失败/通关结算
- 后端重新计算分数
