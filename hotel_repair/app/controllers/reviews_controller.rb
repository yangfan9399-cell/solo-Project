class ReviewsController < ApplicationController
  before_action :authenticate_user!

  def index
    @room_types = Room.room_types.keys
    @repair_categories = RepairRequest::REPAIR_CATEGORIES
    @compensation_statuses = Compensation.statuses.keys

    @room_type_data = compute_room_type_data
    @category_data = compute_category_data
    @compensation_data = compute_compensation_data
    @duration_data = compute_duration_data
  end

  def by_room_type
    @data = compute_room_type_data
  end

  def by_category
    @data = compute_category_data
  end

  def by_compensation
    @data = compute_compensation_data
  end

  def by_duration
    @data = compute_duration_data
  end

  private

  def compute_room_type_data
    RepairRequest.joins(:original_room)
      .group("rooms.room_type")
      .select("rooms.room_type, COUNT(*) as total_count, COUNT(CASE WHEN repair_requests.status = 'archived' THEN 1 END) as archived_count, COUNT(CASE WHEN repair_requests.status = 'cancelled' THEN 1 END) as cancelled_count, AVG(CASE WHEN repair_requests.resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (repair_requests.resolved_at - repair_requests.created_at)) / 3600 END) as avg_hours")
      .map { |r| { room_type: r.room_type, total: r.total_count, archived: r.archived_count, cancelled: r.cancelled_count, avg_hours: r.avg_hours&.round(2) } }
  end

  def compute_category_data
    RepairRequest
      .group(:repair_category)
      .select("repair_category, COUNT(*) as total_count, COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count, AVG(CASE WHEN resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 END) as avg_hours")
      .map { |r| { category: r.repair_category, total: r.total_count, archived: r.archived_count, avg_hours: r.avg_hours&.round(2) } }
  end

  def compute_compensation_data
    Compensation
      .group(:status)
      .select("status as comp_status, COUNT(*) as total_count, AVG(amount) as avg_amount, SUM(amount) as total_amount")
      .map { |r| { status: r.comp_status, total: r.total_count, avg_amount: r.avg_amount&.round(2), total_amount: r.total_amount&.round(2) } }
  end

  def compute_duration_data
    resolved = RepairRequest.where.not(resolved_at: nil)
    {
      under_1h: resolved.where("resolved_at - created_at < interval '1 hour'").count,
      between_1h_4h: resolved.where("resolved_at - created_at >= interval '1 hour' AND resolved_at - created_at < interval '4 hours'").count,
      between_4h_24h: resolved.where("resolved_at - created_at >= interval '4 hours' AND resolved_at - created_at < interval '24 hours'").count,
      over_24h: resolved.where("resolved_at - created_at >= interval '24 hours'").count,
      avg_hours: resolved.average("EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600")&.round(2),
      max_hours: resolved.maximum("EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600")&.round(2),
      min_hours: resolved.minimum("EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600")&.round(2)
    }
  end
end
