class BlacklistsController < ApplicationController
  before_action :set_blacklist, only: [:show, :edit, :update, :destroy]

  def index
    @blacklists = Blacklist.includes(:added_by).order(created_at: :desc)
  end

  def show
  end

  def new
    @blacklist = Blacklist.new
  end

  def create
    @blacklist = Blacklist.new(blacklist_params)

    if @blacklist.save
      redirect_to @blacklist, notice: '已添加到黑名单'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @blacklist.update(blacklist_params)
      redirect_to @blacklist, notice: '黑名单记录已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @blacklist.update(is_active: false)
    redirect_to blacklists_url, notice: '已从黑名单移除'
  end

  private

  def set_blacklist
    @blacklist = Blacklist.find(params[:id])
  end

  def blacklist_params
    params.require(:blacklist).permit(:license_plate, :reason, :added_by_id, :added_at, :is_active)
  end
end
