class DashboardController < ApplicationController
  def index
    @pending_allocations = Allocation.where(status: "pending").count
    @pending_loss_reports = LossReport.where(status: "pending").count
    @near_expiry_batches = Batch.where("expiry_date <= ?", 7.days.from_now.to_date).where("expiry_date > ?", Date.today).count

    @recent_allocations = Allocation.order(created_at: :desc).limit(10)
    @recent_loss_reports = LossReport.order(created_at: :desc).limit(10)

    @statistics = build_statistics
  end

  private

  def build_statistics
    total_loss_quantity = LossReport.sum(:quantity)
    total_batches = Batch.count

    {
      loss_by_region: Region.joins(stores: { batches: :loss_reports })
        .group("regions.name")
        .sum("loss_reports.quantity")
        .transform_values(&:to_d),

      loss_by_category: MaterialCategory.joins(materials: { batches: :loss_reports })
        .group("material_categories.name")
        .sum("loss_reports.quantity")
        .transform_values(&:to_d),

      loss_by_type: LossReport.group(:loss_type).sum(:quantity).transform_values(&:to_d),

      loss_rate: total_batches > 0 ? (total_loss_quantity / Batch.sum(:quantity) * 100).round(2) : 0
    }
  end
end
