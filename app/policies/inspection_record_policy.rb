class InspectionRecordPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.present?
  end

  def update?
    return false if record.archived?
    return true if user.admin?
    return user.can_handle?(record) || user.can_review?(record)
  end

  def handle?
    return false if record.archived?
    user.can_handle?(record)
  end

  def review?
    return false if record.archived?
    user.can_review?(record)
  end

  def accept?
    return false if record.archived?
    user.can_handle?(record)
  end

  def process?
    return false if record.archived?
    user.can_handle?(record)
  end

  def submit_review?
    return false if record.archived?
    user.can_handle?(record)
  end

  def start_review?
    return false if record.archived?
    user.can_review?(record)
  end

  def archive?
    return false if record.archived?
    user.can_review?(record) || user.admin?
  end

  def reject?
    return false if record.archived?
    user.can_review?(record)
  end

  def reprocess?
    return user.admin? if record.archived?
    user.can_handle?(record)
  end

  def submit_correction?
    return false if record.archived?
    user.can_handle?(record)
  end

  def upload_evidence?
    return false if record.archived?
    user.can_handle?(record) || user.can_review?(record)
  end

  def dashboard?
    user.present?
  end

  def review_dashboard?
    user.reviewer? || user.admin?
  end

  def handler_dashboard?
    user.handler? || user.admin?
  end

  def statistics?
    user.present?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
