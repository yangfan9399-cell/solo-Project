class EvidenceAttachmentsController < ApplicationController
  before_action :set_inspection_record
  before_action :set_attachment, only: [:show, :destroy, :download]

  def index
    authorize EvidenceAttachment
    @attachments = @record.evidence_attachments.order(created_at: :desc)
  end

  def new
    @attachment = @record.evidence_attachments.new(uploader: current_user)
    authorize @attachment
  end

  def create
    @attachment = @record.evidence_attachments.new(attachment_params)
    @attachment.uploader = current_user

    latest_node = @record.workflow_nodes.last
    @attachment.workflow_node = latest_node if latest_node

    authorize @attachment

    if @attachment.save
      broadcast_updates

      respond_to do |format|
        format.html { redirect_to @record, notice: '证据附件已上传' }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.append('evidence_attachments', partial: 'evidence_attachments/attachment', locals: { attachment: @attachment }),
            turbo_stream.replace('record_detail', partial: 'inspection_records/detail', locals: { record: @record })
          ]
        end
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
    authorize @attachment
  end

  def download
    authorize @attachment, :download?
    redirect_to rails_blob_url(@attachment.file, disposition: 'attachment')
  end

  def destroy
    authorize @attachment
    @attachment.destroy

    respond_to do |format|
      format.html { redirect_to @record, notice: '附件已删除' }
      format.turbo_stream { render turbo_stream: turbo_stream.remove(@attachment) }
    end
  end

  private

  def set_inspection_record
    @record = InspectionRecord.find(params[:inspection_record_id])
  end

  def set_attachment
    @attachment = @record.evidence_attachments.find(params[:id])
  end

  def attachment_params
    params.require(:evidence_attachment).permit(
      :attachment_type, :description, :file,
      :shoot_time, :shoot_location, :operator
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
