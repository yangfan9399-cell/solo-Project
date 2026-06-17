class AnnotationsController < ApplicationController
  before_action :set_project
  before_action :set_record
  before_action :set_annotation, only: [:update, :destroy]

  def create
    @annotation = @record.annotations.new(annotation_params)
    if @annotation.save
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), notice: "标注添加成功" }
        format.json { render json: @annotation, status: :created }
      end
    else
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), alert: @annotation.errors.full_messages.join(", ") }
        format.json { render json: @annotation.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @annotation.update(annotation_params)
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), notice: "标注更新成功" }
        format.json { render json: @annotation, status: :ok }
      end
    else
      respond_to do |format|
        format.html { redirect_to editor_project_record_path(@project, @record), alert: @annotation.errors.full_messages.join(", ") }
        format.json { render json: @annotation.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @annotation.destroy
    respond_to do |format|
      format.html { redirect_to editor_project_record_path(@project, @record), notice: "标注已删除" }
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

  def set_annotation
    @annotation = @record.annotations.find(params[:id])
  end

  def annotation_params
    params.require(:annotation).permit(:disease_type, :severity, :x, :y, :width, :height, :description, :color)
  end
end
