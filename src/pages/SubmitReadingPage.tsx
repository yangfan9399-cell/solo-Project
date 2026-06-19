import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Image, AlertTriangle, CheckCircle2, FileText, User, Info } from 'lucide-react';
import { api } from '../lib/api';
import { ENUM_OPTIONS, type Batch } from '../types';
import { useAppStore } from '../store/appStore';
import { cn } from '../lib/utils';

export default function SubmitReadingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    observer: currentUser?.name || '',
    rubbing_clarity: '较清晰',
    rust_level: '轻微',
    inscription_damage: '无',
    well_ring_direction: '南',
    rubbing_image: '',
    transcription: '',
    supplement_reading: '',
    supplement_basis: '',
  });

  const [showSupplementAlert, setShowSupplementAlert] = useState(false);
  const [oldTranscriptionHint, setOldTranscriptionHint] = useState<string | undefined>();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getBatchDetail(id)
      .then((data) => {
        setBatch(data.batch);
        if (data.readings[0]?.observer === currentUser?.name) {
          const r = data.readings[0];
          setForm({
            observer: r.observer,
            rubbing_clarity: r.rubbing_clarity,
            rust_level: r.rust_level,
            inscription_damage: r.inscription_damage,
            well_ring_direction: r.well_ring_direction,
            rubbing_image: r.rubbing_image || '',
            transcription: r.transcription,
            supplement_reading: r.supplement_reading || '',
            supplement_basis: r.supplement_basis || '',
          });
        } else if (data.readings[1]?.observer === currentUser?.name) {
          const r = data.readings[1];
          setForm({
            observer: r.observer,
            rubbing_clarity: r.rubbing_clarity,
            rust_level: r.rust_level,
            inscription_damage: r.inscription_damage,
            well_ring_direction: r.well_ring_direction,
            rubbing_image: r.rubbing_image || '',
            transcription: r.transcription,
            supplement_reading: r.supplement_reading || '',
            supplement_basis: r.supplement_basis || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, currentUser?.name]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, rubbing_image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!id || !form.observer || !form.transcription) return;
    setSubmitting(true);
    try {
      const result = await api.submitReading({
        batch_id: id,
        ...form,
      });
      if (result.supplement_conflict_with_old) {
        setShowSupplementAlert(true);
        setOldTranscriptionHint(result.old_transcription);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate(`/batch/${id}`);
      }, 1500);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const showSupplementSection = form.inscription_damage !== '无';
  const isReadOnly = batch?.status === 'merged';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#E8DDC9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B6914]/30 border-t-[#8B6914] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-[#EFE7D8] to-[#E8DDC9]">
      <header className="sticky top-0 z-20 bg-[#2C2416] text-[#F5F0E8] shadow-lg border-b-4 border-[#8B6914]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-[#3D2F1A] border border-[#8B6914]/50 hover:bg-[#4d3d24] transition flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'serif' }}>
                铭牌读数提交
              </h1>
              {batch && (
                <p className="text-xs text-[#C9A44C] opacity-80">
                  {batch.batch_no} · {batch.plaque_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#3D2F1A] px-3 py-1.5 rounded-lg border border-[#8B6914]/50 text-sm">
            <User className="w-4 h-4 text-[#C9A44C]" />
            {currentUser?.name || '未登录'}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isReadOnly && (
          <div className="mb-6 bg-teal-50 border-2 border-teal-300 rounded-xl p-4 flex items-start gap-3 text-teal-900">
            <CheckCircle2 className="w-5 h-5 mt-0.5 text-teal-600 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-0.5">本批次已完成会诊合并</p>
              <p className="opacity-80">您仍可查看历史提交，但改动不会生效。</p>
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex items-start gap-3 text-emerald-900 animate-pulse">
            <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-0.5">读数提交成功！</p>
              <p className="opacity-80">系统已自动比对，即将跳转至会诊对比页...</p>
            </div>
          </div>
        )}

        {showSupplementAlert && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">⚠ 残缺补读与旧藏释文存在冲突</p>
              <p className="opacity-90 mb-2">请提交详细补读依据，会诊官将专项裁定。</p>
              {oldTranscriptionHint && (
                <div className="mt-2 p-3 bg-white/70 rounded-lg border border-amber-300">
                  <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> 旧藏释文参考
                  </p>
                  <p className="text-[#2C2416] text-sm italic">{oldTranscriptionHint}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#FDFAF4] rounded-2xl border-2 border-[#8B6914]/30 shadow-lg overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 24px rgba(44,36,22,0.1)' }}
        >
          <div className="bg-[#2C2416] px-6 py-3 border-b-4 border-[#8B6914]">
            <h2 className="text-[#F5F0E8] font-bold tracking-wider flex items-center gap-2" style={{ fontFamily: 'serif' }}>
              <FileText className="w-4 h-4 text-[#C9A44C]" />
              铭牌观察读数表
            </h2>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <section>
              <h3 className="text-sm font-bold text-[#8B6914] mb-4 pb-2 border-b-2 border-[#8B6914]/20 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#8B6914] rounded-full" />
                铭牌信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">观察人姓名 *</label>
                  <input
                    type="text"
                    value={form.observer}
                    onChange={(e) => setForm({ ...form, observer: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">批次信息</label>
                  <div className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/20 bg-[#F5F0E8] text-sm text-[#5A4A34]">
                    {batch?.batch_no} · {batch?.plaque_name}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-[#8B6914] mb-4 pb-2 border-b-2 border-[#8B6914]/20 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#8B6914] rounded-full" />
                拓片观察
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">拓片清晰度</label>
                  <select
                    value={form.rubbing_clarity}
                    onChange={(e) => setForm({ ...form, rubbing_clarity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914] transition appearance-none cursor-pointer"
                  >
                    {ENUM_OPTIONS.rubbing_clarity.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">拓印图</label>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border-2 border-dashed transition text-sm',
                        form.rubbing_image
                          ? 'border-[#4A7C59] bg-[#E8F3EA] text-[#2C2416]'
                          : 'border-[#8B6914]/40 bg-white hover:border-[#8B6914]/70 hover:bg-[#8B6914]/5 text-[#8B6914]/70 flex items-center justify-center gap-2 h-[92px]',
                      )}
                    >
                      {form.rubbing_image ? (
                        <div className="flex items-center gap-3">
                          <img src={form.rubbing_image} alt="拓片" className="w-16 h-16 object-cover rounded border border-[#8B6914]/30 bg-white" />
                          <div className="flex-1">
                            <p className="font-medium text-[#2C2416] flex items-center gap-1"><Image className="w-3.5 h-3.5" /> 拓片已上传</p>
                            <p className="text-xs text-[#4A7C59] mt-0.5">点击可重新选择</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>点击或拖放上传拓印图</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-[#8B6914] mb-4 pb-2 border-b-2 border-[#8B6914]/20 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#8B6914] rounded-full" />
                锈蚀与残缺
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">锈蚀级别</label>
                  <select
                    value={form.rust_level}
                    onChange={(e) => setForm({ ...form, rust_level: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914] transition appearance-none cursor-pointer"
                  >
                    {ENUM_OPTIONS.rust_level.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">铭文残缺</label>
                  <select
                    value={form.inscription_damage}
                    onChange={(e) => setForm({ ...form, inscription_damage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914] transition appearance-none cursor-pointer"
                  >
                    {ENUM_OPTIONS.inscription_damage.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-[#8B6914] mb-4 pb-2 border-b-2 border-[#8B6914]/20 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#8B6914] rounded-full" />
                井圈与释文
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">井圈方位</label>
                  <div className="flex flex-wrap gap-2">
                    {ENUM_OPTIONS.well_ring_direction.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm({ ...form, well_ring_direction: d })}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition border-2',
                          form.well_ring_direction === d
                            ? 'bg-[#8B6914] text-[#F5F0E8] border-[#8B6914] shadow-sm'
                            : 'bg-white text-[#5A4A34] border-[#8B6914]/30 hover:border-[#8B6914]/60',
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] mb-1.5">释文 *</label>
                  <textarea
                    value={form.transcription}
                    onChange={(e) => setForm({ ...form, transcription: e.target.value })}
                    placeholder="请誊录铭牌铭文内容，保持原文标点与语序..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914] transition resize-none font-serif leading-relaxed"
                    style={{ fontFamily: 'serif' }}
                  />
                  <p className="text-xs text-[#8B6914]/60 mt-1.5">请逐字核对，勿擅自补全缺失字（请在下方补读区填写）。</p>
                </div>
              </div>
            </section>

            {showSupplementSection && (
              <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-300">
                <h3 className="text-sm font-bold text-amber-800 mb-4 pb-2 border-b-2 border-amber-200/60 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-600 rounded-full" />
                  残缺铭文补读标注（铭文残缺时必填）
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] mb-1.5">补读内容</label>
                    <textarea
                      value={form.supplement_reading}
                      onChange={(e) => setForm({ ...form, supplement_reading: e.target.value })}
                      placeholder="例：补「咸平三年」四字，为原碑漫漶处据史志所载..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border-2 border-amber-300 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-amber-500 transition resize-none font-serif leading-relaxed"
                      style={{ fontFamily: 'serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] mb-1.5">补读依据</label>
                    <textarea
                      value={form.supplement_basis}
                      onChange={(e) => setForm({ ...form, supplement_basis: e.target.value })}
                      placeholder="例：据《XX县志·卷三·金石志》记载、结合同出器物形制推断..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border-2 border-amber-300 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-amber-500 transition resize-none"
                    />
                  </div>
                  {batch?.old_transcription && (
                    <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                      <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> 旧藏释文（供参考比对）
                      </p>
                      <p className="text-[#2C2416] text-sm italic font-serif">{batch.old_transcription}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="px-6 md:px-8 py-5 bg-[#F5F0E8] border-t-2 border-[#8B6914]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium bg-white border-2 border-[#8B6914]/30 text-[#5A4A34] hover:bg-[#8B6914]/10 transition"
            >
              取消并返回
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.observer || !form.transcription || isReadOnly}
              className="w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-medium bg-[#8B6914] text-[#F5F0E8] hover:bg-[#755A10] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#F5F0E8]/30 border-t-[#F5F0E8] rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  提交读数
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
