class UsersController < ApplicationController
  def switch
    user = User.find(params[:id])
    session[:user_id] = user.id
    redirect_back fallback_location: root_path, notice: "已切换到 #{user.name}"
  end
end
