class GradeCorrectionPolicy < ApplicationPolicy
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

  def new?
    user.can_process?
  end

  def create?
    user.can_process?
  end

  def edit?
    return false if record.archived? || record.rejected?
    user.frontline_processor? && record.current_owner == user
  end

  def update?
    edit?
  end

  def accept?
    user.frontline_processor? && record.pending?
  end

  def start_processing?
    user.frontline_processor? && record.accepted?
  end

  def submit_for_review?
    user.frontline_processor? && record.processing? && record.current_owner == user
  end

  def approve?
    user.quality_reviewer? && record.reviewing?
  end

  def reject?
    user.quality_reviewer? && (record.reviewing? || record.processing?)
  end

  def return_to_processor?
    user.quality_reviewer? && record.reviewing?
  end

  def reprocess?
    user.frontline_processor? && record.returned?
  end

  def reopen?
    user.quality_reviewer? && (record.archived? || record.rejected?)
  end

  def add_business_record?
    return false if record.archived? || record.rejected?
    user.frontline_processor? && record.current_owner == user
  end

  def add_attachment?
    add_business_record?
  end

  def review?
    show?
  end

  def processing?
    return false if record.archived? || record.rejected?
    user.frontline_processor? && record.current_owner == user
  end

  def dashboard?
    true
  end
end
