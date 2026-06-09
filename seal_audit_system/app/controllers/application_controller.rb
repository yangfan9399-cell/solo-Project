class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  helper_method :current_user

  def current_user
    @current_user ||= User.first || create_default_user
  end

  private

  def create_default_user
    dept = Department.first || Department.create!(name: '默认部门')
    User.create!(name: '系统用户', role: :applicant, department: dept)
  end
end
