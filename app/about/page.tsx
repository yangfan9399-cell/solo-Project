export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto paper-card p-8">
      <h1 className="wood-title text-2xl font-bold mb-4">关于本平台</h1>
      <p className="text-sm text-ink/80 leading-relaxed mb-4">
        《木版年画套色错位分析平台》是面向木版水印工艺保护与数字化传承的专业工作台。围绕
        「扫描入库 → 图层叠合 → 控制点对位 → 偏移量化 → 修版追踪 → 归档导出」的完整工作流，
        为非物质文化遗产工作者、版画收藏机构与艺术院校提供轻量、可本地化的分析工具。
      </p>
      <h2 className="wood-title text-lg font-bold mt-6 mb-2">核心能力</h2>
      <ul className="text-sm text-ink/80 space-y-1.5 leading-relaxed list-disc pl-5">
        <li><b>项目台账</b>：多维度筛选（状态/异常等级/产地/关键词），异常项目优先提示</li>
        <li><b>多版扫描版本化管理</b>：每次扫描为独立版本，支持批次号、设备、分辨率、备注记录</li>
        <li><b>图层透明度叠合</b>：实时透明度/位移/旋转调节，悬停高亮单一色版</li>
        <li><b>控制点对位</b>：参考坐标 vs 实测坐标 ΔX/ΔY/距离三向量统计</li>
        <li><b>偏移统计</b>：各版本达标率、均值/极值/标准差，柱状趋势图</li>
        <li><b>修版记录时间线</b>：对位调整、修版、重印、版材修复等行动可追溯</li>
        <li><b>导出摘要</b>：一键生成 Excel / JSON 项目分析报告，含所有量化数据</li>
      </ul>
      <h2 className="wood-title text-lg font-bold mt-6 mb-2">技术与持久化</h2>
      <ul className="text-sm text-ink/80 space-y-1.5 leading-relaxed list-disc pl-5">
        <li>Next.js 15 App Router + TypeScript + Tailwind CSS</li>
        <li>better-sqlite3 本地文件数据库 <code className="font-mono bg-stone-100 px-1 rounded">data/woodblock.db</code></li>
        <li>Server Actions 负责写入，API Route 负责导出</li>
        <li>全部依赖仓库内安装，无全局要求，xlsx 内置报表</li>
      </ul>
      <h2 className="wood-title text-lg font-bold mt-6 mb-2">判定标准（默认）</h2>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="stat-card">
          <div className="font-medium text-emerald-700">达标 OK</div>
          <div className="text-stone-600 mt-0.5">距离 ≤ 1.5 px</div>
        </div>
        <div className="stat-card">
          <div className="font-medium text-amber-700">预警 WARN</div>
          <div className="text-stone-600 mt-0.5">距离 ≤ 3 px</div>
        </div>
        <div className="stat-card">
          <div className="font-medium text-rose-700">超限 BAD</div>
          <div className="text-stone-600 mt-0.5">距离 &gt; 3 px</div>
        </div>
      </div>
    </div>
  );
}
