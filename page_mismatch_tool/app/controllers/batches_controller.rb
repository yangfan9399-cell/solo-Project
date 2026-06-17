class BatchesController < ApplicationController
  before_action :set_project
  before_action :set_batch, only: %i[show destroy restore]

  def index
    @batches = @project.batches.order(created_at: :desc)
  end

  def show
    @snapshot_data = @batch.page_mappings_from_snapshot
  end

  def create
    @batch = @project.batches.build(batch_params)

    if @batch.save
      redirect_to project_batches_path(@project), notice: "版本快照创建成功。"
    else
      redirect_to project_batches_path(@project), alert: "创建失败: #{@batch.errors.full_messages.join('，')}"
    end
  end

  def destroy
    @batch.destroy!
    redirect_to project_batches_path(@project), notice: "版本快照已删除。", status: :see_other
  end

  def restore
    snapshot_data = @batch.page_mappings_from_snapshot

    if snapshot_data.blank?
      redirect_to project_batches_path(@project), alert: "快照数据为空，无法恢复。"
      return
    end

    ActiveRecord::Base.transaction do
      @project.page_mappings.destroy_all

      snapshot_data.each do |data|
        @project.page_mappings.create!(
          pdf_page_index: data["pdf_page_index"],
          actual_page_number: data["actual_page_number"],
          status: data["status"],
          notes: data["notes"]
        )
      end
    end

    redirect_to project_page_mappings_path(@project), notice: "已从快照恢复页码映射。"
  rescue ActiveRecord::RecordInvalid => e
    redirect_to project_batches_path(@project), alert: "恢复失败: #{e.message}"
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_batch
    @batch = @project.batches.find(params[:id])
  end

  def batch_params
    params.expect(batch: [:name, :description])
  end
end
