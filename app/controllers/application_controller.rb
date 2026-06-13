class ApplicationController < ActionController::Base
  include Pundit::Authorization

  allow_browser versions: :modern
  stale_when_importmap_changes

  before_action :set_current_attributes
  before_action :authenticate_user!
  after_action :verify_authorized, unless: :devise_controller?
  after_action :verify_policy_scoped, only: :index, unless: :devise_controller?

  helper_method :current_user
  helper_method :user_signed_in?

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private

  def set_current_attributes
    Current.request_id = request.uuid
    Current.user_agent = request.user_agent
    Current.ip_address = request.ip
    Current.user = current_user
  end

  def current_user
    return @current_user if defined?(@current_user)

    if session[:user_id]
      @current_user = User.find_by(id: session[:user_id])
    end
    @current_user ||= nil
  end

  def user_signed_in?
    current_user.present?
  end

  def authenticate_user!
    return if user_signed_in?
    return if controller_name == 'sessions'

    redirect_to login_path, alert: '请先登录系统'
  end

  def sign_in(user)
    session[:user_id] = user.id
    @current_user = user
    Current.user = user
  end

  def sign_out
    session.delete(:user_id)
    @current_user = nil
    Current.user = nil
  end

  def user_not_authorized(exception)
    policy_name = exception.policy.class.to_s.underscore
    error = I18n.t "#{policy_name}.#{exception.query}", scope: 'pundit', default: :default

    respond_to do |format|
      format.html { redirect_to request.referrer || root_path, alert: error }
      format.turbo_stream { render turbo_stream: turbo_stream.append('flashes', partial: 'shared/flash', locals: { message: error, type: 'alert' }) }
      format.json { render json: { error: error }, status: :forbidden }
    end
  end

  def record_not_found
    respond_to do |format|
      format.html { redirect_to root_path, alert: '记录不存在或已被删除' }
      format.json { render json: { error: 'Record not found' }, status: :not_found }
    end
  end
end
