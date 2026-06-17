import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { createProject, getProjectByCode } from "~/db/queries";
import { seed } from "~/db/seed";

export const meta = () => [{ title: "新建评估项目" }];

export async function loader(_: LoaderFunctionArgs) {
  seed();
  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const errors: Record<string, string> = {};

  const code = String(form.get("code") || "").trim();
  const name = String(form.get("name") || "").trim();
  const station_name = String(form.get("station_name") || "").trim();
  const river_name = String(form.get("river_name") || "").trim();
  const river_type = String(form.get("river_type") || "mountain");
  const fish_type = String(form.get("fish_type") || "general");
  const designer = String(form.get("designer") || "").trim();
  const description = String(form.get("description") || "").trim() || null;

  if (!code) errors.code = "请输入项目编号";
  else if (!/^[A-Za-z0-9\-_]{2,32}$/.test(code)) errors.code = "项目编号只能包含字母、数字、-、_（2-32字符）";
  else if (getProjectByCode(code)) errors.code = "该项目编号已存在";

  if (!name) errors.name = "请输入项目名称";
  if (!station_name) errors.station_name = "请输入电站名称";
  if (!river_name) errors.river_name = "请输入河流名称";
  if (!designer) errors.designer = "请输入设计人员";

  if (Object.keys(errors).length) {
    return json({ errors, values: Object.fromEntries(form) }, { status: 400 });
  }

  const project = createProject({ code, name, station_name, river_name, river_type: river_type as any, fish_type: fish_type as any, designer, description });
  return redirect(`/projects/${project.id}`);
}

export default function NewProject() {
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const submitting = nav.state === "submitting";
  const errors = (actionData as any)?.errors ?? {};
  const values = (actionData as any)?.values ?? {};

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">➕ 新建鱼道流速评估项目</div>
          <div className="page-subtitle">填写项目基础信息后，将自动创建初始版本（v1.0）并进入工作台</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <div className="card-title">📝 基本信息</div>
        </div>
        <div className="card-body">
          <Form method="post">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">项目编号<span className="required">*</span></label>
                <input className="form-input" name="code" defaultValue={values.code ?? ""} placeholder="例如：FD-2024-006" />
                {errors.code && <div className="form-error">{errors.code}</div>}
                <div className="form-hint">用于唯一标识项目，建议格式 FD-YYYY-NNN</div>
              </div>
              <div className="form-group">
                <label className="form-label">设计人员<span className="required">*</span></label>
                <input className="form-input" name="designer" defaultValue={values.designer ?? ""} placeholder="姓名或工号" />
                {errors.designer && <div className="form-error">{errors.designer}</div>}
              </div>
              <div className="form-group full">
                <label className="form-label">项目名称<span className="required">*</span></label>
                <input className="form-input" name="name" defaultValue={values.name ?? ""} placeholder="例如：XX水电站鱼道流速评估" />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">所在电站<span className="required">*</span></label>
                <input className="form-input" name="station_name" defaultValue={values.station_name ?? ""} placeholder="电站名称" />
                {errors.station_name && <div className="form-error">{errors.station_name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">所属河流<span className="required">*</span></label>
                <input className="form-input" name="river_name" defaultValue={values.river_name ?? ""} placeholder="河流名称" />
                {errors.river_name && <div className="form-error">{errors.river_name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">河流类型</label>
                <select className="form-select" name="river_type" defaultValue={values.river_type ?? "mountain"}>
                  <option value="mountain">山区河流</option>
                  <option value="plain">平原河流</option>
                  <option value="transition">过渡段河流</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">目标鱼种</label>
                <select className="form-select" name="fish_type" defaultValue={values.fish_type ?? "general"}>
                  <option value="general">综合多鱼种</option>
                  <option value="salmon">鲑科（激流型）</option>
                  <option value="carp">鲤科（缓流型）</option>
                  <option value="eel">鳗鲡（降海型）</option>
                  <option value="catfish">鲶形目（底栖型）</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">项目描述</label>
                <textarea className="form-textarea" name="description" defaultValue={values.description ?? ""} placeholder="描述鱼道结构、评估范围、工况等背景信息"></textarea>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button type="button" className="btn btn-secondary" onClick={() => history.back()}>取消</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "创建中..." : "创建并进入工作台 →"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
