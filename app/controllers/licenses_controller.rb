class LicensesController < ApplicationController
  def index
    @licenses = License.includes(:material).order(end_date: :asc)
  end

  def show
    @license = License.find(params[:id])
    @material = @license.material
  end

  def new
    @material = Material.find(params[:material_id]) if params[:material_id]
    @license = License.new(material: @material)
  end

  def create
    @license = License.new(license_params)
    @license.status = determine_status

    if @license.save
      redirect_to material_path(@license.material), notice: '授权创建成功'
    else
      render :new
    end
  end

  def edit
    @license = License.find(params[:id])
  end

  def update
    @license = License.find(params[:id])

    if @license.update(license_params)
      @license.update_status!
      redirect_to license_path(@license), notice: '授权更新成功'
    else
      render :edit
    end
  end

  def destroy
    @license = License.find(params[:id])
    @material = @license.material
    @license.destroy
    redirect_to material_path(@material), notice: '授权已删除'
  end

  def renew
    @license = License.find(params[:id])
    new_end_date = params[:new_end_date]

    if new_end_date.present?
      @license.renew(Date.parse(new_end_date))
      redirect_to license_path(@license), notice: '授权已续约'
    else
      redirect_to license_path(@license), alert: '请提供新的到期日期'
    end
  end

  private

  def license_params
    params.require(:license).permit(:material_id, :licensor, :license_type, :start_date, :end_date, :authorized_channels, :contract_file)
  end

  def determine_status
    return 'document_missing' unless params[:license][:contract_file].present?
    return 'expired' if Date.parse(params[:license][:end_date]) < Date.today

    'active'
  end
end