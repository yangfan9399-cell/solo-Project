class StatisticsController < ApplicationController
  def index
    @by_customer = WorkOrder.joins(:customer).group('customers.name').count
    @by_machine = WorkOrder.group(:machine).count
    
    @reject_reasons = WorkOrderHistory.where(current_status: 'rejected').group(:remark).count
    
    @confirmation_time_stats = calculate_confirmation_time
    
    @total_work_orders = WorkOrder.count
    @completed_work_orders = WorkOrder.where(status: 'completed').count
    @rejected_count = WorkOrder.where(status: 'rejected').count
    @avg_confirmation_days = @confirmation_time_stats[:average]
    @max_confirmation_days = @confirmation_time_stats[:max]
    @min_confirmation_days = @confirmation_time_stats[:min]
  end

  private

  def calculate_confirmation_time
    stats = { average: 0, max: 0, min: nil }
    
    WorkOrder.includes(:work_order_histories).each do |order|
      submitted_at = order.work_order_histories.find_by(current_status: 'proof_submitted')&.created_at
      confirmed_at = order.work_order_histories.find_by(current_status: 'customer_confirmed')&.created_at
      
      next unless submitted_at && confirmed_at
      
      days = (confirmed_at - submitted_at).to_f / 1.day
      
      stats[:max] = days if days > stats[:max]
      stats[:min] = days if stats[:min].nil? || days < stats[:min]
      stats[:total] = (stats[:total] || 0) + days
      stats[:count] = (stats[:count] || 0) + 1
    end
    
    stats[:average] = stats[:count] > 0 ? (stats[:total] / stats[:count]).round(2) : 0
    stats[:max] = stats[:max].round(2)
    stats[:min] = stats[:min] ? stats[:min].round(2) : 0
    
    stats
  end
end