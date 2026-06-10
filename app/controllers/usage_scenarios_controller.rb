class UsageScenariosController < ApplicationController
  def index
    @usage_scenarios = UsageScenario.includes(:material, :license, :bound_by).order(created_at: :desc)
  end

  def show
    @usage_scenario = UsageScenario.find(params[:id])
    @material = @usage_scenario.material
    @license = @usage_scenario.license
    @review_logs = @usage_scenario.review_logs.order(created_at: :desc)
  end

  def new
    @material = Material.find(params[:material_id]) if params[:material_id]
    @licenses = @material&.licenses || License.all
    @usage_scenario = UsageScenario.new(material: @material)
  end

  def create
    @usage_scenario = UsageScenario.new(usage_scenario_params)
    @usage_scenario.bound_by = @current_user
    @usage_scenario.status = 'pending'
    @usage_scenario.approval_status = 'pending'

    if @usage_scenario.save
      redirect_to @usage_scenario, notice: '使用场景创建成功'
    else
      @material = @usage_scenario.material
      @licenses = @material&.licenses || License.all
      render :new
    end
  end

  def edit
    @usage_scenario = UsageScenario.find(params[:id])
    @material = @usage_scenario.material
    @licenses = @material&.licenses || License.all
  end

  def update
    @usage_scenario = UsageScenario.find(params[:id])

    if @usage_scenario.update(usage_scenario_params)
      redirect_to @usage_scenario, notice: '使用场景更新成功'
    else
      @material = @usage_scenario.material
      @licenses = @material&.licenses || License.all
      render :edit
    end
  end

  def destroy
    @usage_scenario = UsageScenario.find(params[:id])
    @material = @usage_scenario.material
    @usage_scenario.destroy
    redirect_to material_path(@material), notice: '使用场景已删除'
  end

  def review
    @usage_scenario = UsageScenario.find(params[:id])
    @material = @usage_scenario.material
    @license = @usage_scenario.license
    @review_logs = @usage_scenario.review_logs.order(created_at: :desc)
  end

  def legal_review
    @usage_scenario = UsageScenario.find(params[:id])
    
    if @usage_scenario.approval_status == 'pending'
      @usage_scenario.confirm_by_legal!(@current_user, params[:comment])
      redirect_to review_usage_scenario_path(@usage_scenario), notice: '法务复核完成'
    else
      redirect_to review_usage_scenario_path(@usage_scenario), alert: '当前状态不允许法务复核'
    end
  end

  def operations_confirm
    @usage_scenario = UsageScenario.find(params[:id])
    
    if @usage_scenario.approval_status == 'legal_reviewed'
      @usage_scenario.confirm_by_operations!(@current_user, params[:comment])
      redirect_to review_usage_scenario_path(@usage_scenario), notice: '运营确认完成'
    else
      redirect_to review_usage_scenario_path(@usage_scenario), alert: '当前状态不允许运营确认'
    end
  end

  def reject
    @usage_scenario = UsageScenario.find(params[:id])
    @usage_scenario.reject!(@current_user, params[:comment])
    redirect_to review_usage_scenario_path(@usage_scenario), notice: '已拒绝并下架'
  end

  def remove
    @usage_scenario = UsageScenario.find(params[:id])
    @usage_scenario.remove!(@current_user, params[:comment])
    redirect_to usage_scenarios_path, notice: '已下架'
  end

  private

  def usage_scenario_params
    params.require(:usage_scenario).permit(:material_id, :license_id, :column_name, :channel, :usage_scope)
  end
end