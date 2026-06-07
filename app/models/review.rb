class Review < ApplicationRecord
  enum :verdict, {
    pending: 0,
    pass: 1,
    revise: 2,
    finalize: 3
  }

  belongs_to :sample
  belongs_to :sample_version
  belongs_to :reviewer, class_name: "User"

  validates :verdict, presence: true
  validates :feedback, presence: true, if: -> { revise? || finalize? }
end
