import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSampleDetail } from "@/lib/actions/sample-actions";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { getMissingRequiredTests, getTestSummary } from "@/lib/test-validation";
import {
  ArrowLeft,
  Package,
  Shield,
  FlaskConical,
  FileText,
  Clock,
  User,
  AlertTriangle,
  History,
  Send,
  RotateCcw,
  ClipboardCheck,
  Gavel,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import SealDamagedModal from "@/components/SealDamagedModal";
import TestResultForm from "@/components/TestResultForm";
import DisposalForm from "@/components/DisposalForm";
import AppealModal from "@/components/AppealModal";

interface SampleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SampleDetailPage({ params }: SampleDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const sample = await getSampleDetail(id);

  if (!sample) {
    return <div>样品不存在</div>;
  }

  const isSealDamaged = sample.sealStatus === "DAMAGED";

  const {
    missingItems: missingRequiredItems,
    hasMissing: hasMissingTests,
  } = getMissingRequiredTests(sample.testItems, sample.testResults);

  const testSummary = getTestSummary(sample.testItems, sample.testResults);

  const isReTestStatus = sample.status === "TESTING" && sample.disposals.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/samples"
            className="mr-4 p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              样品详情
              <StatusBadge status={sample.status} type="sample" />
              {isSealDamaged && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  封签破损
                </span>
              )}
            </h1>
            <p className="text-slate-500 mt-1">
              样品编号：{sample.sampleNo} | 报关单号：
              {sample.customsDeclarationNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.user.role === "INSPECTION_OFFICER" &&
            sample.status === "SAMPLED" &&
            !isSealDamaged && <SendToLabButton sampleId={sample.id} />}

          {session.user.role === "INSPECTION_OFFICER" &&
            sample.status === "RE_SAMPLING" && (
              <form action={async () => {
                "use server";
                const { reSample } = await import("@/lib/actions/sample-actions");
                await reSample(sample.id);
              }}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重新取样
                </button>
              </form>
            )}

          {session.user.role === "LAB_TECHNICIAN" &&
            sample.status === "SENT_TO_LAB" &&
            !isSealDamaged && <ReceiveSampleButton sampleId={sample.id} />}

          {session.user.role === "LAB_TECHNICIAN" &&
            sample.status === "TESTING" &&
            !isSealDamaged && <TestResultForm sample={sample} />}

          {session.user.role === "LAB_TECHNICIAN" &&
            (sample.status === "SENT_TO_LAB" || sample.status === "TESTING") &&
            !isSealDamaged && (
              <SealDamagedModal sampleId={sample.id} />
            )}

          {session.user.role === "DISPOSAL_REVIEWER" &&
            sample.status === "PENDING_DISPOSAL" &&
            !isSealDamaged && <DisposalForm sample={sample} />}

          {sample.status === "DISPOSED" &&
            sample.disposals.length > 0 &&
            sample.disposals[0].isFinal && <AppealModal sampleId={sample.id} />}
        </div>
      </div>

      {isSealDamaged && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800 flex items-center gap-2">
              封签破损 - 流程阻断
              {sample.status === "RE_SAMPLING" && (
                <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                  待重新取样
                </span>
              )}
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {sample.abnormalDescription ||
                "样品封签已破损，根据规定必须阻断结论确认并要求重新取样。"}
            </p>
            {sample.status === "RE_SAMPLING" && sample.currentHandler && (
              <p className="text-sm text-red-700 mt-2 flex items-center">
                <User className="w-4 h-4 mr-1.5" />
                当前责任人：
                <span className="font-medium ml-1">
                  {sample.currentHandler.name}
                </span>
                <span className="text-red-500 text-xs ml-2">
                  （{sample.currentHandler.role === "INSPECTION_OFFICER" ? "查验关员" : sample.currentHandler.role}）
                </span>
              </p>
            )}
            {session.user.role === "INSPECTION_OFFICER" &&
              sample.status === "RE_SAMPLING" && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">
                    🔔 您是当前责任人，请尽快完成重新取样
                  </p>
                  <form
                    action={async () => {
                      "use server";
                      const { reSample } = await import(
                        "@/lib/actions/sample-actions"
                      );
                      await reSample(sample.id);
                    }}
                    className="mt-2"
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      立即重新取样
                    </button>
                  </form>
                </div>
              )}
            {session.user.role === "LAB_TECHNICIAN" &&
              sample.status === "RE_SAMPLING" && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600">
                    📤 已转交查验关员重新取样，待新样品送检后继续检测流程
                  </p>
                </div>
              )}
            {session.user.role === "DISPOSAL_REVIEWER" &&
              sample.status === "RE_SAMPLING" && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600">
                    ⏳ 待查验关员重新取样并完成检测后，再进入处置复核环节
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {isReTestStatus && hasMissingTests && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800 flex items-center">
              补检中 - 需补检 {missingRequiredItems.length} 项必检项目
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              该样品因检测项目漏选被退回补检，完成所有必检项目后方可再次提交处置。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingRequiredItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300 font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {sample.status === "PENDING_DISPOSAL" && hasMissingTests && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 flex items-center">
              ⚠️ 检测项目漏选 - 禁止合格放行
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              存在 {missingRequiredItems.length} 项必检项目未检测，处置复核仅允许补检或扣留，不得放行归档。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingRequiredItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-800 text-xs rounded-md border border-amber-300"
                >
                  漏检：{item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center">
              <Package className="w-5 h-5 text-customs-600 mr-2" />
              <h2 className="font-semibold text-slate-800">报关单与货物信息</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoItem label="报关单号" value={sample.customsDeclarationNo} />
                <InfoItem label="货物名称" value={sample.goodsName} />
                <InfoItem label="商品类别" value={sample.goodsCategory} />
                <InfoItem label="HS编码" value={sample.hsCode || "-"} />
                <InfoItem
                  label="数量"
                  value={
                    sample.quantity ? `${sample.quantity} ${sample.unit || ""}` : "-"
                  }
                />
                <InfoItem label="原产国" value={sample.originCountry || "-"} />
                <InfoItem label="口岸" value={sample.port} />
                <InfoItem label="收货人" value={sample.consignee || "-"} />
                <InfoItem label="发货人" value={sample.consignor || "-"} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center">
              <Shield className="w-5 h-5 text-customs-600 mr-2" />
              <h2 className="font-semibold text-slate-800">封签状态</h2>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {sample.seals.map((seal) => (
                  <div
                    key={seal.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <Shield
                        className={`w-5 h-5 mr-3 ${
                          seal.status === "INTACT"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-slate-800">
                          封签号：{seal.sealNo}
                        </p>
                        {seal.sealedAt && (
                          <p className="text-xs text-slate-500">
                            施封时间：{formatDate(seal.sealedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={seal.status} type="seal" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center">
                <FlaskConical className="w-5 h-5 text-customs-600 mr-2" />
                <h2 className="font-semibold text-slate-800">检测指标与结果</h2>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                  已检测 {testSummary.completedCount}/{sample.testItems.length}
                </span>
                {hasMissingTests && (
                  <span className="inline-flex items-center text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                    需补检 {missingRequiredItems.length} 项
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              {hasMissingTests && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">
                    ⚠️ 以下必检项目尚未检测，需补检完成后方可处置
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missingRequiredItems.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-800 text-xs rounded-md border border-amber-300 font-medium"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="text-left pb-3 font-medium">检测项目</th>
                      <th className="text-left pb-3 font-medium">属性</th>
                      <th className="text-left pb-3 font-medium">检测结果</th>
                      <th className="text-left pb-3 font-medium">状态</th>
                      <th className="text-left pb-3 font-medium">检测人员</th>
                      <th className="text-left pb-3 font-medium">检测时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.testItems.map((item) => {
                      const result = sample.testResults.find(
                        (r) => r.testItemId === item.id
                      );
                      const isMissing =
                        item.isRequired &&
                        (!result ||
                          result.resultStatus === "PENDING" ||
                          result.resultStatus === "NOT_TESTED");
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-100 last:border-0 ${
                            isMissing ? "bg-amber-50" : ""
                          }`}
                        >
                          <td className="py-3">
                            <div className="flex items-center">
                              {isMissing && (
                                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                              )}
                              <span
                                className={`font-medium ${
                                  isMissing
                                    ? "text-amber-900"
                                    : "text-slate-800"
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            {item.isRequired ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded">
                                必检
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                                选检
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3 ${
                              isMissing ? "text-amber-700" : "text-slate-600"
                            }`}
                          >
                            {result?.resultValue ||
                              (isMissing ? "待补检" : "-")}
                          </td>
                          <td className="py-3">
                            {result ? (
                              <StatusBadge
                                status={result.resultStatus}
                                type="test"
                              />
                            ) : (
                              <StatusBadge status="PENDING" type="test" />
                            )}
                          </td>
                          <td className="py-3 text-slate-600">
                            {result?.tester?.name || "-"}
                          </td>
                          <td className="py-3 text-slate-500">
                            {result?.testedAt ? formatDate(result.testedAt) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {sample.disposals.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center">
                <Gavel className="w-5 h-5 text-customs-600 mr-2" />
                <h2 className="font-semibold text-slate-800">处置结论</h2>
              </div>
              <div className="p-5 space-y-4">
                {sample.disposals.map((disposal, idx) => (
                  <div
                    key={disposal.id}
                    className={`p-4 rounded-lg border ${
                      idx === 0
                        ? "bg-customs-50 border-customs-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={disposal.disposalType}
                          type="disposal"
                        />
                        {idx === 0 && disposal.isFinal && (
                          <span className="text-xs text-customs-600 font-medium">
                            最终结论
                          </span>
                        )}
                        {disposal.appealCount > 0 && (
                          <span className="text-xs text-purple-600 font-medium">
                            已复议 {disposal.appealCount} 次
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(disposal.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p>
                        <span className="text-slate-500">处置依据：</span>
                        {disposal.disposalBasis}
                      </p>
                      {disposal.remarks && (
                        <p className="mt-1">
                          <span className="text-slate-500">备注：</span>
                          {disposal.remarks}
                        </p>
                      )}
                      <p className="mt-1">
                        <span className="text-slate-500">复核人：</span>
                        {disposal.reviewer?.name || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center">
              <User className="w-5 h-5 text-customs-600 mr-2" />
              <h2 className="font-semibold text-slate-800">当前责任人</h2>
            </div>
            <div className="p-5">
              {sample.currentHandler ? (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-customs-100 flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-customs-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {sample.currentHandler.name}
                    </p>
                    <StatusBadge
                      status={sample.currentHandler.role}
                      type="role"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">暂无</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center">
              <Clock className="w-5 h-5 text-customs-600 mr-2" />
              <h2 className="font-semibold text-slate-800">时间节点</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <TimelineItem
                label="取样时间"
                value={sample.samplingTime ? formatDate(sample.samplingTime) : "-"}
                icon={<FlaskConical className="w-4 h-4" />}
              />
              <TimelineItem
                label="送检时间"
                value={sample.sentToLabTime ? formatDate(sample.sentToLabTime) : "-"}
                icon={<Send className="w-4 h-4" />}
              />
              <TimelineItem
                label="实验室收样"
                value={sample.labReceivedTime ? formatDate(sample.labReceivedTime) : "-"}
                icon={<ClipboardCheck className="w-4 h-4" />}
              />
              <TimelineItem
                label="检测完成"
                value={sample.testCompletedTime ? formatDate(sample.testCompletedTime) : "-"}
                icon={<FlaskConical className="w-4 h-4" />}
              />
              <TimelineItem
                label="处置时间"
                value={sample.disposalTime ? formatDate(sample.disposalTime) : "-"}
                icon={<Gavel className="w-4 h-4" />}
              />
            </div>
          </div>

          {sample.reSampleParent && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start">
                <RotateCcw className="w-5 h-5 text-orange-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    关联原样品
                  </p>
                  <Link
                    href={`/samples/${sample.reSampleParent.id}`}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    {sample.reSampleParent.sampleNo}
                  </Link>
                  <StatusBadge
                    status={sample.reSampleParent.status}
                    type="sample"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {sample.reSampleChildren.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start">
                <RotateCcw className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    重新取样记录
                  </p>
                  {sample.reSampleChildren.map((child) => (
                    <div key={child.id} className="mt-1">
                      <Link
                        href={`/samples/${child.id}`}
                        className="text-sm text-green-600 hover:underline"
                      >
                        {child.sampleNo}
                      </Link>
                      <StatusBadge status={child.status} type="sample" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center">
              <History className="w-5 h-5 text-customs-600 mr-2" />
              <h2 className="font-semibold text-slate-800">历史节点</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {sample.auditLogs.map((log, idx) => (
                  <div key={log.id} className="relative pl-6 pb-4">
                    {idx < sample.auditLogs.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200" />
                    )}
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-customs-500 border-2 border-white" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {log.action}
                      </p>
                      {log.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {log.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {formatDate(log.timestamp)}
                        </span>
                        {log.operator && (
                          <span className="text-xs text-slate-400">
                            · {log.operator.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}

function SendToLabButton({ sampleId }: { sampleId: string }) {
  const sendToLab = async () => {
    "use server";
    const { sendSampleToLab } = await import("@/lib/actions/sample-actions");
    await sendSampleToLab(sampleId);
  };

  return (
    <form action={sendToLab}>
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 bg-customs-600 hover:bg-customs-700 text-white font-medium rounded-lg transition-colors"
      >
        <Send className="w-4 h-4 mr-2" />
        送检
      </button>
    </form>
  );
}

function ReceiveSampleButton({ sampleId }: { sampleId: string }) {
  const receiveSample = async () => {
    "use server";
    const { receiveSample } = await import("@/lib/actions/lab-disposal-actions");
    await receiveSample(sampleId);
  };

  return (
    <form action={receiveSample}>
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
      >
        <ClipboardCheck className="w-4 h-4 mr-2" />
        接收样品
      </button>
    </form>
  );
}
