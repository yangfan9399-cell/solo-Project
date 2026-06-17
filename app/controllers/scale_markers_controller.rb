class ScaleMarkersController < ApplicationController
  before_action :set_project
  before_action :set_record
  before_action :set_scale_marker, only: [:update, :destroy]

  def create
    @scale_marker = @record.scale_markers.new(scale_marker_params)
    if @scale_marker.save
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), notice: "尺度标记添加成功" }
        format.json { render json: @scale_marker, status: :created }
      end
    else
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), alert: @scale_marker.errors.full_messages.join(", ") }
        format.json { render json: @scale_marker.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @scale_marker.update(scale_marker_params)
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), notice: "尺度标记更新成功" }
        format.json { render json: @scale_marker, status: :ok }
      end
    else
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), alert: @scale_marker.errors.full_messages.join(", ") }
        format.json { render json: @scale_marker.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @scale_marker.destroy
    respond_to do |format|
      format.html { redirect_to editor_project_record_path(@project, @record), notice: "尺度标记已删除" }
      format.json { head :no_content }
    end
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_record
    @record = @project.records.find(params[:record_id])
  end

  def set_scale_marker
    @scale_marker = @record.scale_markers.find(params[:id])
  end

  def scale_marker_params
    params.require(:scale_marker).permit(:x, :y, :length_pixels, :length_cm, :orientation)
  end
end
