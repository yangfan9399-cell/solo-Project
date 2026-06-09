class DashboardController < ApplicationController
  def index
    @stats = {
      total_batches: LinenBatch.count,
      pending_batches: LinenBatch.where(status: 'pending').count,
      washing_batches: LinenBatch.where(status: %w[collected washed]).count,
      quality_checking: LinenBatch.where(status: 'returned').count,
      disputed: LinenBatch.where(status: 'disputed').count,
      settled: LinenBatch.where(status: 'settled').count,
      total_damage_amount: DamageClaim.confirmed.sum(:total_amount)
    }

    @recent_batches = LinenBatch.recent.limit(10)
    @disputed_batches = LinenBatch.where(status: 'disputed').recent.limit(5)
    @hotels = Hotel.all.order(:name)
  end
end
