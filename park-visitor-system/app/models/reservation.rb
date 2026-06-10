class Reservation < ApplicationRecord
  belongs_to :visitor
  belongs_to :vehicle
  belongs_to :host, class_name: 'Employee'
  belongs_to :entrance
  has_one :visit_record, dependent: :nullify

  enum :status, {
    pending: 0,
    confirmed: 1,
    rejected: 2,
    expired: 3,
    cancelled: 4
  }, prefix: true

  validates :purpose, presence: true
  validates :scheduled_at, presence: true

  scope :upcoming, -> { where('scheduled_at > ?', Time.current).where(status: [:pending, :confirmed]) }
  scope :active, -> { where(status: [:pending, :confirmed]) }

  def expired?
    scheduled_end_at && scheduled_end_at < Time.current
  end

  def can_be_verified?
    confirmed? && !expired?
  end

  def create_visit_record!
    VisitRecord.create!(reservation: self)
  end

  def may_confirm?
    pending?
  end

  def may_reject?
    pending?
  end

  def confirm!
    update!(status: :confirmed) if may_confirm?
  end

  def reject!
    update!(status: :rejected) if may_reject?
  end
end
