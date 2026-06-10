class ContractsController < ApplicationController
  before_action :require_login
  before_action :require_role, "admin", "legal"
  before_action :set_contract, only: [:show]

  def index
    @contracts = Contract.all.order(created_at: :desc)
    @contracts = @contracts.where(status: params[:status]) if params[:status].present?
  end

  def show
    @application = @contract.application
    @versions = @contract.contract_versions.order(version_number: :desc)
  end

  private

  def set_contract
    @contract = Contract.find(params[:id])
  end
end