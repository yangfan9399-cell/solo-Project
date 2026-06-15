import { component$, useSignal, $ } from '@builder.io/qwik';
import { Form, globalAction$, zod$, z, redirect } from '@builder.io/qwik-city';
import { createMainRecord } from '~/lib/db';

export const useCreateBatch = globalAction$(() => {
  return async (form: Record<string, any>) => {
    const parsed = z.object({
      solutionARatio: z.coerce.number().min(1).max(100),
      solutionBRatio: z.coerce.number().min(1).max(100),
      solutionC_Ratio: z.coerce.number().nullable().optional(),
      totalVolumeMl: z.coerce.number().min(10),
      paperType: z.string().min(2),
      paperWeightGsm: z.coerce.number().min(50),
      notes: z.string().optional(),
      createdBy: z.string().min(2),
    }).safeParse(form);

    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten() };
    }
    const data = parsed.data;
    const main = createMainRecord({
      solutionARatio: data.solutionARatio,
      solutionBRatio: data.solutionBRatio,
      solutionC_Ratio: data.solutionC_Ratio ?? null,
      totalVolumeMl: data.totalVolumeMl,
      paperType: data.paperType,
      paperWeightGsm: data.paperWeightGsm,
      notes: data.notes || undefined,
      createdBy: data.createdBy,
    });
    throw redirect(302, `/batch/${main.id}`);
  };
});

export default component$(() => {
  const action = useCreateBatch();
  const preset = useSignal<'standard' | 'rich' | 'contrast'>('standard');

  const applyPreset = $((p: string) => {
    preset.value = p as any;
  });

  const presets = {
    standard: { a: 25, b: 10, c: 5, vol: 200, paper: '水彩纸 300g 粗纹', gsm: 300 },
    rich:     { a: 30, b: 12, c: 6, vol: 240, paper: '棉浆纸 250g 中粗', gsm: 250 },
    contrast: { a: 20, b: 15, c: 3, vol: 190, paper: '素描纸 200g 细纹', gsm: 200 },
  };

  const p = presets[preset.value];

  return (
    <div>
      <div class="card">
        <div class="card-title">
          <span>➕ 新建显影批次 · 主记录层</span>
          <span class="badge">Step 1 / 4</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {(['standard', 'rich', 'contrast'] as const).map(k => (
            <button
              key={k}
              onClick$={() => applyPreset(k)}
              class={`btn ${preset.value === k ? 'btn-primary' : ''}`}
              type="button"
            >
              {k === 'standard' && '📐 标准配方'}
              {k === 'rich' && '💧 浓郁蓝调'}
              {k === 'contrast' && '⚖ 高对比度'}
            </button>
          ))}
        </div>

        <Form action={action} spaReset>
          <div class="form-grid">
            <div class="form-field">
              <label>药液 A 比例 (柠檬酸铁铵 g)</label>
              <input name="solutionARatio" type="number" step="0.5" value={p.a} required />
            </div>
            <div class="form-field">
              <label>药液 B 比例 (铁氰化钾 g)</label>
              <input name="solutionBRatio" type="number" step="0.5" value={p.b} required />
            </div>
            <div class="form-field">
              <label>药液 C 比例 (阿拉伯胶 g, 可选)</label>
              <input name="solutionC_Ratio" type="number" step="0.5" value={p.c} />
            </div>
            <div class="form-field">
              <label>总溶剂容量 (ml)</label>
              <input name="totalVolumeMl" type="number" step="1" value={p.vol} required />
            </div>
            <div class="form-field">
              <label>纸张类型</label>
              <input name="paperType" type="text" value={p.paper} required />
            </div>
            <div class="form-field">
              <label>纸张克重 (g/m²)</label>
              <input name="paperWeightGsm" type="number" step="1" value={p.gsm} required />
            </div>
            <div class="form-field">
              <label>记录人 / 操作员</label>
              <input name="createdBy" type="text" placeholder="您的姓名" required />
            </div>
          </div>
          <div class="form-field" style={{ marginTop: 14 }}>
            <label>备注 (涂布手法、环境条件等)</label>
            <textarea name="notes" placeholder={`如：玻璃棒均匀涂布，阴干30分钟后使用...`}></textarea>
          </div>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary">💾 创建批次并进入明细录入</button>
            <button type="reset" class="btn">重置</button>
          </div>
        </Form>
      </div>

      <div class="card">
        <div class="card-title">
          <span>📚 配方比例说明</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, fontSize: 13 }}>
          <div style={{ padding: 12, background: 'var(--cyan-pale)', borderRadius: 8 }}>
            <b style={{ color: 'var(--cyan-blue)' }}>标准配方 25:10</b>
            <div style={{ marginTop: 6, color: 'var(--ink-muted)' }}>25g 柠檬酸铁铵 + 10g 铁氰化钾 / 200ml 水。通用配方，蓝色适中。</div>
          </div>
          <div style={{ padding: 12, background: '#e6f4ea', borderRadius: 8 }}>
            <b style={{ color: 'var(--success-green)' }}>浓郁配方 30:12</b>
            <div style={{ marginTop: 6, color: 'var(--ink-muted)' }}>A/B 液浓度更高，产生更深邃的普鲁士蓝，适合厚纸或高饱和需求。</div>
          </div>
          <div style={{ padding: 12, background: '#fef3e2', borderRadius: 8 }}>
            <b style={{ color: 'var(--warning-amber)' }}>高对比 20:15</b>
            <div style={{ marginTop: 6, color: 'var(--ink-muted)' }}>B液比例提高，明暗边界更锐利。注意控制曝光，避免过曝灰雾。</div>
          </div>
        </div>
      </div>
    </div>
  );
});
