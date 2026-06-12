class FaultRecordPolicy < ApplicationPolicy
  class Scope < Scope
    def resolve
      scope.all
    end
  end

  def index?
    true
  end

  def show?
    true
  end

  def dashboard?
    true
  end

  def review?
    true
  end

  def create?
    true
  end

  def new?
    create?
  end

  def update?
    return false if record.is_archived?
    return true if user.admin?
    return true if user.quality_reviewer? && record.in_review_status?
    return true if user.field_handler? && record.processing? && record.current_owner_id == user.id
    false
  end

  def edit?
    update?
  end

  def process_record?
    return false if record.is_archived?
    return true if user.admin?
    user.field_handler? && record.processing? && record.current_owner_id == user.id
  end

  def accept?
    return false if record.is_archived?
    return true if user.admin?
    user.quality_reviewer?
  end

  def assign_handler?
    return false if record.is_archived?
    return true if user.admin?
    user.quality_reviewer?
  end

  def submit_review?
    return false if record.is_archived?
    return true if user.admin?
    user.field_handler? && record.processing? && record.current_owner_id == user.id
  end

  def review_pass?
    return false if record.is_archived?
    return true if user.admin?
    user.quality_reviewer? && (record.pending_review? || record.reviewing?)
  end

  def return_supplement?
    return false if record.is_archived?
    return true if user.admin?
    user.quality_reviewer? && (record.pending_review? || record.reviewing?)
  end

  def reopen?
    return true if user.admin?
    user.quality_reviewer? && record.archived?
  end

  def upload_evidence?
    return false if record.is_archived?
    return true if user.admin?
    user.field_handler? && record.processing? && record.current_owner_id == user.id
  end

  def start_review?
    return false if record.is_archived?
    return true if user.admin?
    user.quality_reviewer? && record.pending_review?
  end
end
