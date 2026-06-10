class ApplicationController < ActionController::Base
  before_action :set_current_user

  def set_current_user
    @current_user ||= User.first || create_default_users
  end

  def create_default_users
    User.create!(
      name: '系统管理员',
      email: 'admin@example.com',
      role: 'copyright_manager',
      department: 'copyright'
    )
  end
end