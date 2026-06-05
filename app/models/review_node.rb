class ReviewNode < ApplicationRecord
  belongs_to :course_package
  belongs_to :reviewer, class_name: 'User'
  belongs_to :parent_node, class_name: 'ReviewNode', optional: true
  has_many :child_nodes, class_name: 'ReviewNode', foreign_key: 'parent_node_id', dependent: :destroy

  STATUSES = %w[pending approved rejected archived disputed].freeze
  ALGORITHMS = %w[standard discounted penalty].freeze

  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :refund_amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :old_refund_amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :new_refund_amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def approve!(manager_notes = nil)
    transaction do
      update!(status: 'approved', review_notes: manager_notes, reviewed_at: Time.current)
      course_package.update!(status: 'refund_approved')
    end
  end

  def reject!(manager_notes = nil)
    transaction do
      update!(status: 'rejected', review_notes: manager_notes, reviewed_at: Time.current)
      course_package.update!(status: 'refund_rejected')
    end
  end

  def archive!
    transaction do
      update!(status: 'archived')
      course_package.update!(status: 'archived')
    end
  end

  def reopen!(new_reviewer, new_algorithm, dispute_reason)
    return false unless status == 'archived'

    transaction do
      new_node = course_package.review_nodes.create!(
        reviewer: new_reviewer,
        status: 'disputed',
        refund_amount: course_package.calculate_refund(new_algorithm),
        refund_algorithm: new_algorithm,
        old_refund_amount: refund_amount,
        new_refund_amount: course_package.calculate_refund(new_algorithm),
        dispute_reason:,
        parent_node: self
      )
      course_package.update!(status: 'refund_pending')
      new_node
    end
  end

  def disputed?
    status == 'disputed'
  end

  def amount_difference
    return 0 unless old_refund_amount && new_refund_amount

    new_refund_amount - old_refund_amount
  end
end
