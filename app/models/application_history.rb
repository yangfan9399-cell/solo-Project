class ApplicationHistory < ApplicationRecord
  belongs_to :application
  belongs_to :operator, class_name: "User", optional: true

  enum action: {
    created: "created",
    submitted: "submitted",
    reviewed: "reviewed",
    approved: "approved",
    rejected: "rejected",
    disputed: "disputed",
    settled: "settled",
    archived: "archived"
  }

  validates :action, presence: true
end