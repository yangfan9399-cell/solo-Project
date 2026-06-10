class MaterialsController < ApplicationController
  def index
    @materials = Material.includes(:created_by, :current_license).order(created_at: :desc)
  end

  def show
    @material = Material.find(params[:id])
    @license = @material.current_license
    @usage_scenarios = @material.usage_scenarios.includes(:license, :bound_by, :review_logs)
  end

  def new
    @material = Material.new
  end

  def create
    @material = Material.new(material_params)
    @material.created_by = @current_user

    if @material.save
      redirect_to @material, notice: '素材创建成功'
    else
      render :new
    end
  end

  def edit
    @material = Material.find(params[:id])
  end

  def update
    @material = Material.find(params[:id])

    if @material.update(material_params)
      redirect_to @material, notice: '素材更新成功'
    else
      render :edit
    end
  end

  def destroy
    @material = Material.find(params[:id])
    @material.destroy
    redirect_to materials_path, notice: '素材已删除'
  end

  private

  def material_params
    params.require(:material).permit(:name, :material_type, :description, :copyright_holder, :file_url)
  end
end