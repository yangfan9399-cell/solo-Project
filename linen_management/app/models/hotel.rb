class Hotel < ApplicationRecord
  has_many :linen_batches, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validates :contact_person, presence: true
  validates :phone, presence: true

  def total_damage_amount
    linen_batches.joins(:damage_claims).where(damage_claims: { confirmed: true }).sum('damage_claims.total_amount')
  end

  def batch_count
    linen_batches.count
  end
end
