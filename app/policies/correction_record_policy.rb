class CorrectionRecordPolicy < ApplicationPolicy
  def create?
    return false if record.inspection_record.archived?
    user.can_handle?(record.inspection_record)
  end

  def update?
    return false if record.inspection_record.archived?
    user.admin? || record.handler_id == user.id
  end

  def destroy?
    return false if record.inspection_record.archived?
    user.admin?
  end
end
