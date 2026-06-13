class HomePolicy < ApplicationPolicy
  def index?
    user.present?
  end
end
