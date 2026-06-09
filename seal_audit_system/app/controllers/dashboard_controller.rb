class DashboardController < ApplicationController
  def index
    @seal_applications = SealApplication.order(created_at: :desc).limit(20)
    @stats = {
      total: SealApplication.count,
      pending: SealApplication.where(status: [:pending_legal, :legal_approved, :pending_seal, :seal_approved]).count,
      completed: SealApplication.where(status: [:archived]).count,
      abnormal: SealApplication.where(status: [:version_conflict, :legal_rejected, :seal_rejected, :approver_absent, :archive_missing_pages]).count
    }
  end

  def review
    @by_department = SealApplication.by_department
    @by_seal_type = SealApplication.by_seal_type
    @by_anomaly = SealApplication.by_anomaly
    @duration_stats = SealApplication.approval_duration_stats
    @seal_applications = SealApplication.order(created_at: :desc).all
  end
end
