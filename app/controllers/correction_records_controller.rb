class CorrectionRecordsController < ApplicationController
  before_action :set_inspection_record
  before_action :set_correction_record, only: [:edit, :update, :destroy]

  def new
    @correction = @record.correction_records.new(
      handler_id: current_user.id,
      correction_time: Time.current
    )
    authorize @correction
  end

  def create
    @correction = @record.correction_records.new(correction_record_params)
    @correction.handler_id ||= current_user.id
    authorize @correction

    ActiveRecord::Base.transaction do
      if @correction.save
        latest_node = @record.workflow_nodes.last
        @correction.update(workflow_node_id: latest_node.id) if latest_node

        broadcast_updates

        respond_to do |format|
          format.html { redirect_to @record, notice: '整改记录已提交' }
          format.turbo_stream do
            render turbo_stream: [
              turbo_stream.append('correction_records', partial: 'correction_records/correction', locals: { correction: @correction }),
              turbo_stream.replace('record_detail', partial: 'inspection_records/detail', locals: { record: @record })
            ]
          end
        end
      else
        render :new, status: :unprocessable_entity
      end
    end
  end

  def edit
    authorize @correction
  end

  def update
    authorize @correction

    if @correction.update(correction_record_params)
      broadcast_updates
      redirect_to @record, notice: '整改记录已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @correction
    @correction.destroy
    redirect_to @record, notice: '整改记录已删除'
  end

  private

  def set_inspection_record
    @record = InspectionRecord.find(params[:inspection_record_id])
  end

  def set_correction_record
    @correction = @record.correction_records.find(params[:id])
  end

  def correction_record_params
    params.require(:correction_record).permit(
      :business_record, :site_description, :correction_measure,
      :correction_result, :correction_time, :remark, :operator
    )
  end

  def broadcast_updates
    Turbo::StreamsChannel.broadcast_replace_to(
      "inspection_record_#{@record.id}",
      target: 'record_detail',
      partial: 'inspection_records/detail',
      locals: { record: @record }
    )
  end
end
