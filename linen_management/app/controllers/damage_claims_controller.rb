class DamageClaimsController < ApplicationController
  before_action :set_linen_batch
  before_action :set_damage_claim, only: [:edit, :update, :destroy, :confirm]

  def new
    @damage_claim = @linen_batch.damage_claims.new
    @linen_types = LinenType.all.order(:name)
  end

  def create
    @damage_claim = @linen_batch.damage_claims.new(damage_claim_params)

    if @damage_claim.save
      @linen_batch.add_event('claim_created', current_user, "新增赔损：#{@damage_claim.linen_type.name} #{@damage_claim.reason_name}")
      redirect_to @linen_batch, notice: '赔损记录创建成功。'
    else
      @linen_types = LinenType.all.order(:name)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @linen_types = LinenType.all.order(:name)
  end

  def update
    if @damage_claim.update(damage_claim_params)
      redirect_to @linen_batch, notice: '赔损记录更新成功。'
    else
      @linen_types = LinenType.all.order(:name)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @damage_claim.destroy
    redirect_to @linen_batch, notice: '赔损记录已删除。'
  end

  def confirm
    if @damage_claim.confirm!(current_user)
      @linen_batch.add_event('claim_confirmed', current_user, "确认赔损：#{@damage_claim.linen_type.name} #{@damage_claim.reason_name}")
      redirect_to @linen_batch, notice: '赔损已确认。'
    else
      redirect_to @linen_batch, alert: '确认失败。'
    end
  end

  private

  def set_linen_batch
    @linen_batch = LinenBatch.find(params[:linen_batch_id])
  end

  def set_damage_claim
    @damage_claim = @linen_batch.damage_claims.find(params[:id])
  end

  def damage_claim_params
    params.require(:damage_claim).permit(:linen_type_id, :quantity, :unit_price, :total_amount, :reason)
  end
end
