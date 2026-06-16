class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  before_action :authenticate_player!

  helper_method :current_player
  helper_method :player_signed_in?

  private

  def current_player
    return nil unless session[:player_id]

    @current_player ||= Player.find_by(id: session[:player_id])
  end

  def player_signed_in?
    current_player.present?
  end

  def authenticate_player!
    return if current_player

    redirect_to new_session_path, alert: '请先选择或创建玩家档案'
  end

  def sign_in(player)
    session[:player_id] = player.id
    @current_player = player
  end

  def sign_out
    session.delete(:player_id)
    @current_player = nil
  end
end
