class StatisticsController < ApplicationController
  def index
    @total_props = Prop.count
    @total_borrows = BorrowRecord.count
    @total_damaged = BorrowRecord.damaged.count
    @total_compensation = Compensation.sum(:amount)
    @total_repairs = RepairRecord.count

    @props_by_category = Prop.group(:category).count
    @props_by_status = Prop.group(:status).count

    borrows_by_month = BorrowRecord.group("DATE_TRUNC('month', created_at)").count
    @borrows_by_month = borrows_by_month.map do |month, count|
      [month.strftime("%Y年%m月"), count]
    end.to_h

    compensation_by_month = Compensation.group("DATE_TRUNC('month', created_at)").sum(:amount)
    @total_compensation_by_month = compensation_by_month.map do |month, amount|
      [month.strftime("%Y年%m月"), amount]
    end.to_h

    @damages_by_type = BorrowRecord.damaged.group(:damage_type).count
  end

  def by_category
    @category_stats = Prop.all.map do |prop|
      borrow_count = prop.borrow_records.count
      damage_count = prop.borrow_records.damaged.count
      compensation_total = Compensation.joins(:borrow_record).where(borrow_records: { prop_id: prop.id }).sum(:amount)
      {
        prop: prop,
        borrow_count: borrow_count,
        damage_count: damage_count,
        compensation_total: compensation_total
      }
    end

    @category_summary = Prop.group(:category).count
  end

  def by_crew
    @crew_stats = Crew.all.map do |crew|
      borrow_count = crew.borrow_records.count
      damage_count = crew.borrow_records.damaged.count
      compensation_total = Compensation.joins(:borrow_record).where(borrow_records: { crew_id: crew.id }).sum(:amount)
      {
        crew: crew,
        borrow_count: borrow_count,
        damage_count: damage_count,
        compensation_total: compensation_total
      }
    end
    @crew_stats.sort_by! { |s| -s[:borrow_count] }
  end

  def by_damage_type
    @damage_stats = BorrowRecord.damaged.group(:damage_type).count
    @compensation_by_damage_type = BorrowRecord.damaged.joins(:compensation)
      .group("borrow_records.damage_type")
      .sum("compensations.amount")

    @damage_details = BorrowRecord.damaged.includes(:prop, :crew, :compensation).order(created_at: :desc)
  end

  def compensation_amount
    @total_compensation = Compensation.sum(:amount)
    @paid_compensation = Compensation.paid.sum(:amount)
    @pending_compensation = Compensation.pending.sum(:amount)
    @disputed_compensation = Compensation.disputed.sum(:amount)

    @compensation_by_prop = Compensation.joins(borrow_record: :prop)
      .group("props.name")
      .sum("compensations.amount")
      .sort_by { |_, amount| -amount }

    @compensation_by_crew = Compensation.joins(borrow_record: :crew)
      .group("crews.name")
      .sum("compensations.amount")
      .sort_by { |_, amount| -amount }

    @recent_compensations = Compensation.order(created_at: :desc).limit(20).includes(borrow_record: [:prop, :crew])
  end
end
