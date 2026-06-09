class SealApplicationsController < ApplicationController
  before_action :set_seal_application, only: [:show, :submit, :legal_approve, :legal_reject, :resolve_version, :seal_approve, :seal_reject, :mark_absent, :resume_absence, :archive_approve, :fix_archive]

  def index
    @seal_applications = SealApplication.order(created_at: :desc).all
    @filter = params[:status]
    @seal_applications = @seal_applications.where(status: params[:status]) if params[:status].present?
  end

  def show
    @approval_chain = @seal_application.approval_chain
  end

  def new
    @seal_application = SealApplication.new
    @contracts = Contract.all
    @seals = Seal.active.all
  end

  def create
    @seal_application = SealApplication.new(seal_application_params)
    @seal_application.applicant = current_user

    if @seal_application.save
      redirect_to @seal_application, notice: '用印申请创建成功'
    else
      @contracts = Contract.all
      @seals = Seal.active.all
      render :new, status: :unprocessable_entity
    end
  end

  def submit
    if @seal_application.submit!
      redirect_to @seal_application, notice: '用印申请已提交'
    else
      redirect_to @seal_application, alert: '提交失败'
    end
  end

  def legal_approve
    user = User.find_by(role: :legal) || current_user
    comment = params[:comment] || ''
    if @seal_application.legal_approve!(user, comment)
      if @seal_application.version_conflict?
        redirect_to @seal_application, alert: '合同版本不一致，已阻断用印，请重新确认最新版本'
      else
        redirect_to @seal_application, notice: '法务审核通过'
      end
    else
      redirect_to @seal_application, alert: '审核失败'
    end
  end

  def legal_reject
    user = User.find_by(role: :legal) || current_user
    comment = params[:comment] || ''
    if @seal_application.legal_reject!(user, comment)
      redirect_to @seal_application, notice: '法务审核未通过'
    else
      redirect_to @seal_application, alert: '操作失败'
    end
  end

  def resolve_version
    user = current_user
    contract_id = params[:contract_id]
    if @seal_application.resolve_version_conflict!(contract_id, user)
      redirect_to @seal_application, notice: '合同版本已更新，重新提交审核'
    else
      redirect_to @seal_application, alert: '版本更新失败，请选择最新版本合同'
    end
  end

  def seal_approve
    user = User.find_by(role: :seal_admin) || current_user
    comment = params[:comment] || ''
    if @seal_application.seal_approve!(user, comment)
      redirect_to @seal_application, notice: '印章管理员已执行用印'
    else
      redirect_to @seal_application, alert: '操作失败'
    end
  end

  def seal_reject
    user = User.find_by(role: :seal_admin) || current_user
    comment = params[:comment] || ''
    if @seal_application.seal_reject!(user, comment)
      redirect_to @seal_application, notice: '印章管理员已拒绝用印'
    else
      redirect_to @seal_application, alert: '操作失败'
    end
  end

  def mark_absent
    user = current_user
    comment = params[:comment] || ''
    if @seal_application.mark_approver_absent!(user, comment)
      redirect_to @seal_application, notice: '已标记审批人缺席，流程暂停'
    else
      redirect_to @seal_application, alert: '操作失败'
    end
  end

  def resume_absence
    user = User.find_by(role: :seal_admin) || current_user
    if @seal_application.resume_from_absence!(user)
      redirect_to @seal_application, notice: '流程已恢复'
    else
      redirect_to @seal_application, alert: '操作失败'
    end
  end

  def archive_approve
    user = User.find_by(role: :auditor) || current_user
    file_name = params[:file_name] || '归档文件.pdf'
    page_count = params[:page_count]&.to_i || 10
    missing_pages = params[:missing_pages]&.to_i || 0

    if @seal_application.archive_approve!(user, file_name, page_count, missing_pages)
      if @seal_application.archive_missing_pages?
        redirect_to @seal_application, alert: "归档文件缺页 #{missing_pages} 页，请补全后重新归档"
      else
        redirect_to @seal_application, notice: '归档完成'
      end
    else
      redirect_to @seal_application, alert: '归档失败'
    end
  end

  def fix_archive
    user = User.find_by(role: :auditor) || current_user
    file_name = params[:file_name] || '归档文件.pdf'
    page_count = params[:page_count]&.to_i || 10
    missing_pages = params[:missing_pages]&.to_i || 0

    if @seal_application.fix_archive!(user, file_name, page_count, missing_pages)
      if @seal_application.archive_missing_pages?
        redirect_to @seal_application, alert: "补全后仍缺页 #{missing_pages} 页"
      else
        redirect_to @seal_application, notice: '归档补全完成'
      end
    else
      redirect_to @seal_application, alert: '操作失败'
    end
  end

  private

  def set_seal_application
    @seal_application = SealApplication.find(params[:id])
  end

  def seal_application_params
    params.require(:seal_application).permit(:contract_id, :seal_id, :purpose, :use_count)
  end

end
