class HistoryNode < ApplicationRecord
  belongs_to :visit_record
  belongs_to :actor, polymorphic: true

  validates :action, presence: true

  def actor_name
    case actor_type
    when 'Employee'
      actor.name
    when 'Visitor'
      actor.name
    when 'System'
      '系统'
    else
      actor.to_s
    end
  end

  def actor_display_name
    actor.try(:name) || '系统'
  end
end
