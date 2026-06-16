import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getDb, getOne } from "~/lib/db";
import type { GameSession, Level, ConfusionMatrix, ScoringResult } from "~/lib/db";

interface ResultData {
  session: GameSession;
  level: Level;
  matrix: ConfusionMatrix | null;
  score: ScoringResult | null;
  nextLevel: Level | null;
  trainingSetCount: number;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const db = await getDb();
  const sessionId = Number(params.sessionId);

  const session = getOne<GameSession>(db, "SELECT * FROM game_sessions WHERE id = ?", [sessionId]);
  if (!session) {
    throw new Response("会话未找到", { status: 404 });
  }

  const level = getOne<Level>(db, "SELECT * FROM levels WHERE id = ?", [session.level_id])!;

  const nextLevel = getOne<Level>(db, "SELECT * FROM levels WHERE order_index > ? ORDER BY order_index ASC LIMIT 1", [level.order_index]) ?? null;

  let matrix: ConfusionMatrix | null = null;
  if (session.confusion_matrix_json) {
    matrix = JSON.parse(session.confusion_matrix_json) as ConfusionMatrix;
  }

  let score: ScoringResult | null = null;
  if (session.score !== null && matrix) {
    score = {
      base_score: Math.round(matrix.f1 * 1000),
      precision_bonus:
        matrix.precision >= level.target_precision
          ? Math.round((matrix.precision - level.target_precision) * 500)
          : 0,
      recall_bonus:
        matrix.recall >= level.target_recall
          ? Math.round((matrix.recall - level.target_recall) * 500)
          : 0,
      f1_score: Math.round(matrix.f1 * 100) / 100,
      time_bonus: 0,
      total_score: session.score,
      confusion_matrix: matrix,
    };
  }

  let trainingSetCount = 0;
  if (session.training_set_json) {
    const trainingSet = JSON.parse(session.training_set_json);
    if (Array.isArray(trainingSet)) {
      trainingSetCount = trainingSet.length;
    }
  }

  return json<ResultData>({
    session,
    level,
    matrix,
    score,
    nextLevel,
    trainingSetCount,
  });
}

export default function Result() {
  const { session, level, matrix, score, nextLevel, trainingSetCount } =
    useLoaderData<typeof loader>();

  const isPassed = session.status === "completed";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-12 px-4">
      <div
        className={`w-full max-w-2xl rounded-2xl border-2 p-8 text-center mb-8 ${
          isPassed
            ? "border-green-500 bg-green-950/30"
            : "border-red-500 bg-red-950/30"
        }`}
      >
        <div className="text-6xl mb-3">{isPassed ? "🎉" : "💔"}</div>
        <h1
          className={`text-4xl font-extrabold ${
            isPassed ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPassed ? "通关" : "失败"}
        </h1>
        <p className="mt-2 text-gray-400">
          {level.name} —{" "}
          {isPassed ? "恭喜你成功通过本关！" : "未达到目标准确率或召回率，再试一次吧！"}
        </p>
      </div>

      {matrix && (
        <div className="w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-200">混淆矩阵</h2>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <div className="text-center text-sm text-gray-400 py-1">
              预测阳性
            </div>
            <div className="text-center text-sm text-gray-400 py-1">
              预测阴性
            </div>

            <div className="flex items-center justify-center text-sm text-gray-400 px-2">
              实际阳性
            </div>
            <div className="matrix-cell tp rounded-lg text-lg">
              {matrix.tp}
            </div>
            <div className="matrix-cell fn rounded-lg text-lg">
              {matrix.fn}
            </div>

            <div className="flex items-center justify-center text-sm text-gray-400 px-2">
              实际阴性
            </div>
            <div className="matrix-cell fp rounded-lg text-lg">
              {matrix.fp}
            </div>
            <div className="matrix-cell tn rounded-lg text-lg">
              {matrix.tn}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">准确率</div>
              <div className="text-2xl font-bold text-wafer-300">
                {(matrix.precision * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">召回率</div>
              <div className="text-2xl font-bold text-wafer-300">
                {(matrix.recall * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">F1 分数</div>
              <div className="text-2xl font-bold text-wafer-300">
                {(matrix.f1 * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {score && (
        <div className="w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-200">得分明细</h2>
          <div className="rounded-lg bg-gray-900 border border-gray-700 divide-y divide-gray-800">
            <div className="flex justify-between px-5 py-3">
              <span className="text-gray-400">基础分 (F1×1000)</span>
              <span className="font-mono text-gray-200">{score.base_score}</span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-gray-400">准确率奖励</span>
              <span className="font-mono text-green-400">
                +{score.precision_bonus}
              </span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-gray-400">召回率奖励</span>
              <span className="font-mono text-green-400">
                +{score.recall_bonus}
              </span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-gray-400">时间奖励</span>
              <span className="font-mono text-green-400">
                +{score.time_bonus}
              </span>
            </div>
            <div className="flex justify-between px-5 py-4 bg-gray-800/50">
              <span className="font-bold text-gray-200">总分</span>
              <span className="font-mono text-xl font-bold text-wafer-300">
                {score.total_score}
              </span>
            </div>
          </div>
        </div>
      )}

      {trainingSetCount > 0 && (
        <div className="w-full max-w-2xl mb-8">
          <div className="rounded-lg border border-wafer-800 bg-wafer-950/20 p-4 flex items-center gap-3">
            <div className="text-2xl">📚</div>
            <div>
              <div className="font-semibold text-wafer-300">
                训练集扩充
              </div>
              <div className="text-sm text-gray-400">
                本次判读已为训练集新增 {trainingSetCount} 张标注图像
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {isPassed && nextLevel ? (
          <Link
            to={`/game/${nextLevel.id}?playerId=${session.player_id}`}
            className="rounded-lg bg-wafer-600 px-8 py-3 font-semibold text-white hover:bg-wafer-700 transition-colors"
          >
            下一关
          </Link>
        ) : (
          <Link
            to={`/game/${level.id}?playerId=${session.player_id}`}
            className="rounded-lg bg-red-700 px-8 py-3 font-semibold text-white hover:bg-red-800 transition-colors"
          >
            重试
          </Link>
        )}
        <Link
          to="/"
          className="rounded-lg bg-gray-800 px-8 py-3 font-semibold text-gray-300 hover:bg-gray-700 transition-colors"
        >
          返回大厅
        </Link>
      </div>
    </div>
  );
}
