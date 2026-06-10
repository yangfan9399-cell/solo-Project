class ContractsController < ApplicationController
  before_action :require_login
  before_action :require_role, "admin", "legal"
  before_action :set_contract, only: [:show, :update]

  def index
    @contracts = Contract.all.order(created_at: :desc)
    @contracts = @contracts.where(status: params[:status]) if params[:status].present?
  end

  def show
    @application = @contract.application
    @versions = @contract.contract_versions.order(version_number: :desc)
  end

  def update
    if @contract.update(contract_params)
      redirect_to @contract, notice: "合同状态已更新"
    else
      redirect_to @contract, alert: "更新失败"
    end
  end

  private

  def set_contract
    @contract = Contract.find(params[:id])
  end

  def contract_params
    params.require(:contract).permit(:status, :signed_date)
  end
end