class RecordsController < ApplicationController
  before_action :set_project
  before_action :set_record, only: [:show, :edit, :update, :destroy, :editor]

  def index
    @records = @project.records.includes(:annotations).order(record_date: :desc)
  end

  def show
    @annotations = @record.annotations
    @scale_markers = @record.scale_markers
  end

  def new
    @record = @project.records.new
  end

  def create
    @record = @project.records.new(record_params)
    if @record.save
      redirect_to editor_project_record_path(@project, @record), notice: "记录创建成功，请添加标注"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @record.update(record_params)
      redirect_to project_record_path(@project, @record), notice: "记录更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @record.destroy
    redirect_to project_path(@project), notice: "记录已删除"
  end

  def editor
    @annotations = @record.annotations.order(:id)
    @scale_markers = @record.scale_markers
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_record
    @record = @project.records.find(params[:id])
  end

  def record_params
    params.require(:record).permit(:batch_number, :record_date, :photographer, :observer, :weather, :temperature, :humidity, :image_url, :notes, :version_type)
  end
end
