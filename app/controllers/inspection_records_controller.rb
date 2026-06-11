class InspectionRecordsController < ApplicationController
  before_action :set_return_order, only: [:new, :create]

  def new
    @inspection_record = @return_order.inspection_records.new
  end

  def create
    @inspection_record = @return_order.inspection_records.new(inspection_record_params)

    if @inspection_record.save
      update_return_order_inspection_result
      @return_order.complete_inspection!
      redirect_to @return_order, notice: '质检记录创建成功'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
    @inspection_record = InspectionRecord.find(params[:id])
    @return_order = @inspection_record.return_order
  end

  private

  def set_return_order
    @return_order = ReturnOrder.find(params[:return_order_id])
  end

  def inspection_record_params
    raw = params.require(:inspection_record).permit(
      :condition,
      :final_decision,
      :inspector_name,
      :damage_description,
      :missing_items_count,
      :quality_score,
      :photos_text
    )
    if raw[:photos_text].present?
      raw[:photos] = raw.delete(:photos_text).lines.map(&:strip).reject(&:blank?)
    end
    raw
  end

  def update_return_order_inspection_result
    missing = @inspection_record.missing_items_count.to_i > 0
    damaged = @inspection_record.damage_description.present? && @inspection_record.poor?
    @return_order.update!(
      missing_items: missing,
      damaged: damaged,
      resaleable: @inspection_record.resale?
    )
  end
end
