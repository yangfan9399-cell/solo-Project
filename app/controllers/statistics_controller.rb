class StatisticsController < ApplicationController
  def index
    @total_props = Prop.count
    @total_borrows = BorrowRecord.count
    @total_damaged = BorrowRecord.with_damage.count
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

    @damages_by_type = BorrowRecord.with_damage.where.not(damage_type: nil).group(:damage_type).count
  end

  def by_category
    props_by_category = Prop.includes(borrow_records: :compensation).group_by(&:category)

    @category_stats = props_by_category.map do |category, props|
      prop_count = props.count
      borrow_count = props.sum { |p| p.borrow_records.count }
      damage_count = props.sum { |p| p.borrow_records.with_damage.count }
      compensation_total = props.sum do |p|
        p.borrow_records.joins(:compensation).sum("compensations.amount")
      end

      prop_details = props.map do |prop|
        prop_borrow_count = prop.borrow_records.count
        prop_damage_count = prop.borrow_records.with_damage.count
        prop_compensation = prop.borrow_records.joins(:compensation).sum("compensations.amount")
        {
          prop: prop,
          borrow_count: prop_borrow_count,
          damage_count: prop_damage_count,
          compensation_total: prop_compensation
        }
      end.sort_by { |s| -s[:borrow_count] }

      {
        category: category,
        prop_count: prop_count,
        borrow_count: borrow_count,
        damage_count: damage_count,
        compensation_total: compensation_total,
        props: prop_details
      }
    end.sort_by { |s| -s[:borrow_count] }
  end

  def by_crew
    @crew_stats = Crew.all.map do |crew|
      borrow_count = crew.borrow_records.count
      damage_count = crew.borrow_records.with_damage.count
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
    @damage_stats = BorrowRecord.with_damage.where.not(damage_type: nil).group(:damage_type).count
    @compensation_by_damage_type = BorrowRecord.with_damage.joins(:compensation)
      .where.not(borrow_records: { damage_type: nil })
      .group("borrow_records.damage_type")
      .sum("compensations.amount")

    @damage_details = BorrowRecord.with_damage.includes(:prop, :crew, :compensation).order(created_at: :desc)
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
