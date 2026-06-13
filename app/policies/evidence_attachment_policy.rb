class EvidenceAttachmentPolicy < ApplicationPolicy
  def create?
    return false if record.inspection_record.archived?
    user.can_handle?(record.inspection_record) || user.can_review?(record.inspection_record)
  end

  def destroy?
    return false if record.inspection_record.archived?
    user.admin? || record.uploader_id == user.id
  end

  def download?
    user.present?
  end
end
