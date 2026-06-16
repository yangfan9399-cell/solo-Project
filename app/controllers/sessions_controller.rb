class SessionsController < ApplicationController
  skip_before_action :authenticate_player!, only: [:new, :create]

  def new
    @players = Player.all.order(created_at: :desc)
  end

  def create
    player_name = params[:player_name].to_s.strip
    if player_name.blank?
      flash[:alert] = '请输入玩家名称'
      redirect_to new_session_path and return
    end

    player = Player.find_or_create_local(player_name)
    sign_in(player)

    redirect_to levels_path, notice: "欢迎，#{player.name}！"
  end

  def destroy
    sign_out
    redirect_to new_session_path, notice: '已退出玩家档案'
  end
end
