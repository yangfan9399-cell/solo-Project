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
    @confirmation_count = @confirmation_time_stats[:count]
  end

  private

  def calculate_confirmation_time
    stats = { average: 0, max: 0, min: nil, total: 0, count: 0 }
    
    WorkOrder.find_each do |order|
      proof_submitted = order.work_order_histories.find_by(current_status: 'proof_submitted')
      customer_confirmed = order.work_order_histories.find_by(current_status: 'customer_confirmed')
      
      next unless proof_submitted && customer_confirmed
      
      submitted_time = proof_submitted.created_at
      confirmed_time = customer_confirmed.created_at
      
      days = (confirmed_time - submitted_time).to_f / 1.day
      
      stats[:max] = days if days > stats[:max]
      stats[:min] = days if stats[:min].nil? || days < stats[:min]
      stats[:total] += days
      stats[:count] += 1
    end
    
    stats[:average] = stats[:count] > 0 ? (stats[:total] / stats[:count]).round(2) : 0
    stats[:max] = stats[:max].round(2)
    stats[:min] = stats[:min] ? stats[:min].round(2) : 0
    
    stats
  end
end