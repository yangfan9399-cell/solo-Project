class Review < ApplicationRecord
  belongs_to :application
  belongs_to :reviewer, class_name: "User"

  enum review_type: {
    copyright: "copyright",
    legal: "legal",
    finance: "finance"
  }

  enum status: {
    approved: "approved",
    rejected: "rejected",
    needs_revision: "needs_revision"
  }

  validates :review_type, presence: true
  validates :status, presence: true
  validates :comment, presence: true, if: :rejected?

  after_create :update_application_status

  private

  def update_application_status
    case status
    when "approved"
      application.update(status: next_status)
    when "rejected"
      application.update(status: "rejected", rejection_reason: comment)
    when "needs_revision"
      application.update(status: "draft")
    end
  end

  def next_status
    case review_type
    when "copyright"
      "pending_legal"
    when "legal"
      "pending_finance"
    when "finance"
      "approved"
    end
  end
end