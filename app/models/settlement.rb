class Settlement < ApplicationRecord
  belongs_to :application

  enum status: {
    pending: "pending",
    confirmed: "confirmed",
    disputed: "disputed",
    archived: "archived"
  }

  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  validates :copyright_holder_share, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 100 }
  validates :agent_share, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 100 }

  validate :shares_sum_to_100

  private

  def shares_sum_to_100
    return unless copyright_holder_share && agent_share
    total = copyright_holder_share + agent_share
    errors.add(:agent_share, "分成比例总和必须为100%") if total != 100
  end
end