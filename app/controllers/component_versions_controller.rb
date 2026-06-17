class ComponentVersionsController < ApplicationController
  before_action :find_component
  before_action :find_version, only: [:show, :diff]

  def index
    @page = (params[:page] || 1).to_i
    @per_page = 20
    scope = @component.component_versions.order(version_number: :desc)
    @total_count = scope.count
    @versions = scope.offset((@page - 1) * @per_page).limit(@per_page)
    @total_pages = (@total_count.to_f / @per_page).ceil
  end

  def show
    @snapshot = JSON.parse(@version.object_snapshot || "{}") rescue {}
  end

  def diff
    @version2 = @component.component_versions.find_by(version_number: params[:compare_version])
    @snapshot1 = JSON.parse(@version.object_snapshot || "{}") rescue {}
    @snapshot2 = @version2 ? (JSON.parse(@version2.object_snapshot || "{}") rescue {}) : {}

    @changes = {}
    all_keys = (@snapshot1.keys + @snapshot2.keys).uniq
    all_keys.each do |key|
      if @snapshot1[key] != @snapshot2[key]
        @changes[key] = { before: @snapshot1[key], after: @snapshot2[key] }
      end
    end
  end

  private

  def find_component
    @project = Project.find(params[:project_id])
    @component = @project.components.find(params[:component_id])
  end

  def find_version
    @version = @component.component_versions.find(params[:id])
  end
end
