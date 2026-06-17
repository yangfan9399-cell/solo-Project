class AnnotationsController < ApplicationController
  before_action :set_annotation, only: [:show, :update, :destroy]

  def show
  end

  def update
    if @annotation.update(annotation_params)
      head :ok
    else
      head :unprocessable_entity
    end
  end

  def destroy
    @annotation.destroy
    redirect_to @annotation.run_chart, notice: '标注已删除'
  end

  private

  def set_annotation
    @annotation = Annotation.find(params[:id])
  end

  def annotation_params
    params.require(:annotation).permit(:status, :content)
  end
end