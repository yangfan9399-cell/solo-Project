class AnnotationsController < ApplicationController
  before_action :set_annotation, only: [:show, :update, :destroy]
  before_action :set_run_chart, only: [:create]

  def show
  end

  def create
    annotation = @run_chart.annotations.new(annotation_params)
    if annotation.save
      redirect_to project_run_chart_workbench_path(
        @run_chart.project, @run_chart
      ), notice: '标注已添加'
    else
      redirect_to project_run_chart_workbench_path(
        @run_chart.project, @run_chart
      ), alert: '标注添加失败'
    end
  end

  def update
    if @annotation.update(annotation_params)
      head :ok
    else
      head :unprocessable_entity
    end
  end

  def destroy
    run_chart = @annotation.run_chart
    @annotation.destroy
    redirect_to project_run_chart_workbench_path(
      run_chart.project, run_chart
    ), notice: '标注已删除'
  end

  private

  def set_annotation
    @annotation = Annotation.find(params[:id])
  end

  def set_run_chart
    @run_chart = RunChart.find(params[:run_chart_id])
  end

  def annotation_params
    permitted = params.require(:annotation).permit(
      :type, :content, :x_coordinate, :y_coordinate, :x, :y, :severity, :status
    )
    if permitted[:x].present?
      permitted[:x_coordinate] = permitted.delete(:x)
    end
    if permitted[:y].present?
      permitted[:y_coordinate] = permitted.delete(:y)
    end
    permitted
  end
end