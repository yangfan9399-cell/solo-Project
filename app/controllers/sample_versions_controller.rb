class SampleVersionsController < ApplicationController
  before_action :require_login
  before_action :set_sample
  before_action :set_sample_version, only: [:show]

  def show
  end

  def new
    @sample_version = @sample.sample_versions.build
    @sample_version.version_number = @sample.version_count + 1
    last_version = @sample.current_version
    if last_version
      @sample_version.fabric = last_version.fabric
      @sample_version.size_chart = last_version.size_chart
    end
  end

  def create
    size_chart = parse_size_chart(params[:sample_version][:size_chart])
    @sample_version = @sample.sample_versions.build(sample_version_params)
    @sample_version.created_by = current_user
    @sample_version.version_number = @sample.version_count + 1
    @sample_version.size_chart = size_chart

    if @sample_version.save
      @sample.increment!(:version_count)
      @sample.update!(
        status: :review,
        fabric: @sample_version.fabric,
        size_chart: size_chart,
        current_owner_id: User.reviewer.first&.id
      )
      flash[:notice] = "新版本已创建，已提交评审"
      redirect_to [@sample, @sample_version]
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def parse_size_chart(size_chart_param)
    return {} if size_chart_param.blank?
    return size_chart_param if size_chart_param.is_a?(Hash)

    begin
      parsed = JSON.parse(size_chart_param)
      parsed.is_a?(Hash) ? parsed : {}
    rescue JSON::ParserError
      {}
    end
  end

  def set_sample
    @sample = Sample.find(params[:sample_id])
  end

  def set_sample_version
    @sample_version = @sample.sample_versions.find(params[:id])
  end

  def sample_version_params
    params.require(:sample_version).permit(
      :description,
      :fabric,
      size_chart: {}
    )
  end
end
