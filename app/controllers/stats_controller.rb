class StatsController < ApplicationController
  def index
    @stats_by_anchor = stats_by_anchor
    @stats_by_category = stats_by_category
    @stats_by_reason = stats_by_reason
    @overall_stats = overall_stats
  end

  private

  def stats_by_anchor
    resold_status = ReturnOrder.statuses[:resold]
    ReturnOrder.joins(:anchor)
               .group('anchors.id', 'anchors.name')
               .select(
                 'anchors.id AS anchor_id',
                 'anchors.name AS anchor_name',
                 'COUNT(DISTINCT return_orders.id) AS total_count',
                 "COUNT(DISTINCT CASE WHEN return_orders.status = '#{resold_status}' THEN return_orders.id END) AS resold_count",
                 "COUNT(DISTINCT CASE WHEN return_orders.status = '#{resold_status}' THEN return_orders.id END)::FLOAT / NULLIF(COUNT(DISTINCT return_orders.id), 0) AS resale_rate"
               )
  end

  def stats_by_category
    resold_status = ReturnOrder.statuses[:resold]
    ReturnOrder.joins(:product)
               .group('products.category')
               .select(
                 'products.category AS category',
                 'COUNT(DISTINCT return_orders.id) AS total_count',
                 "COUNT(DISTINCT CASE WHEN return_orders.status = '#{resold_status}' THEN return_orders.id END) AS resold_count",
                 "COUNT(DISTINCT CASE WHEN return_orders.status = '#{resold_status}' THEN return_orders.id END)::FLOAT / NULLIF(COUNT(DISTINCT return_orders.id), 0) AS resale_rate"
               )
  end

  def stats_by_reason
    ReturnOrder.group(:reason)
               .select('reason, COUNT(*) AS count')
               .order('count DESC')
  end

  def overall_stats
    total_count = ReturnOrder.count
    completed_count = ReturnOrder.completed.count
    resold_count = ReturnOrder.resold.count
    resale_rate = total_count.zero? ? 0 : resold_count.to_f / total_count

    {
      total_count: total_count,
      completed_count: completed_count,
      resold_count: resold_count,
      resale_rate: resale_rate
    }
  end
end
