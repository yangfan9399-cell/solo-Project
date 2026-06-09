class StatisticsController < ApplicationController
  def index
    @date_from = params[:date_from]&.to_date || 30.days.ago.to_date
    @date_to = params[:date_to]&.to_date || Date.today
    @hotel_id = params[:hotel_id]

    @stats_by_hotel = stats_by_hotel
    @stats_by_category = stats_by_category
    @stats_by_problem_type = stats_by_problem_type
    @stats_by_damage_amount = stats_by_damage_amount

    @totals = calculate_totals
  end

  private

  def base_scope
    scope = LinenBatch.where(created_at: @date_from.beginning_of_day..@date_to.end_of_day)
    scope = scope.where(hotel_id: @hotel_id) if @hotel_id.present?
    scope
  end

  def stats_by_hotel
    Hotel.left_joins(linen_batches: :damage_claims)
         .where(linen_batches: { created_at: @date_from.beginning_of_day..@date_to.end_of_day })
         .where.not(damage_claims: { id: nil })
         .group('hotels.id, hotels.name')
         .select(
           'hotels.id',
           'hotels.name',
           'COUNT(DISTINCT linen_batches.id) as batch_count',
           'SUM(CASE WHEN damage_claims.confirmed = true THEN damage_claims.total_amount ELSE 0 END) as confirmed_damage_amount',
           'SUM(CASE WHEN damage_claims.confirmed = false THEN damage_claims.total_amount ELSE 0 END) as pending_damage_amount',
           'COUNT(damage_claims.id) as claim_count'
         )
         .order('confirmed_damage_amount DESC')
  end

  def stats_by_category
    LinenType.left_joins(damage_claims: :linen_batch)
             .where(linen_batches: { created_at: @date_from.beginning_of_day..@date_to.end_of_day })
             .where.not(damage_claims: { id: nil })
             .group('linen_types.id, linen_types.name, linen_types.category')
             .select(
               'linen_types.id',
               'linen_types.name',
               'linen_types.category',
               'SUM(CASE WHEN damage_claims.confirmed = true THEN damage_claims.quantity ELSE 0 END) as total_quantity',
               'SUM(CASE WHEN damage_claims.confirmed = true THEN damage_claims.total_amount ELSE 0 END) as total_amount',
               'COUNT(damage_claims.id) as claim_count'
             )
             .order('total_amount DESC')
  end

  def stats_by_problem_type
    claims = DamageClaim.joins(:linen_batch)
                        .where(linen_batches: { created_at: @date_from.beginning_of_day..@date_to.end_of_day })

    if @hotel_id.present?
      claims = claims.where(linen_batches: { hotel_id: @hotel_id })
    end

    claims.group(:reason)
          .select(
            'reason',
            'COUNT(*) as claim_count',
            'SUM(quantity) as total_quantity',
            'SUM(CASE WHEN confirmed = true THEN total_amount ELSE 0 END) as confirmed_amount',
            'SUM(CASE WHEN confirmed = false THEN total_amount ELSE 0 END) as pending_amount'
          )
          .order('confirmed_amount DESC')
  end

  def stats_by_damage_amount
    batch_list = base_scope.joins(:damage_claims)
                           .where(damage_claims: { confirmed: true })
                           .group('linen_batches.id')
                           .select('linen_batches.id', 'SUM(damage_claims.total_amount) as total_amount')
                           .to_a

    amounts = batch_list.map { |b| b.total_amount.to_f }

    {
      total_batches_with_damage: batch_list.size,
      min_amount: amounts.min || 0,
      max_amount: amounts.max || 0,
      avg_amount: amounts.any? ? (amounts.sum / amounts.size).round(2) : 0,
      total_amount: amounts.sum.round(2)
    }
  end

  def calculate_totals
    all_claims = DamageClaim.joins(:linen_batch)
                            .where(linen_batches: { created_at: @date_from.beginning_of_day..@date_to.end_of_day })

    if @hotel_id.present?
      all_claims = all_claims.where(linen_batches: { hotel_id: @hotel_id })
    end

    {
      total_batches: base_scope.count,
      total_claims: all_claims.count,
      confirmed_claims: all_claims.where(confirmed: true).count,
      pending_claims: all_claims.where(confirmed: false).count,
      total_confirmed_amount: all_claims.where(confirmed: true).sum(:total_amount),
      total_pending_amount: all_claims.where(confirmed: false).sum(:total_amount),
      total_quantity: all_claims.sum(:quantity)
    }
  end
end
