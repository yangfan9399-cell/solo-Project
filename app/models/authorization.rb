class Authorization < ApplicationRecord
  belongs_to :report

  AUTH_TYPES = [
    ["委托书", "power_of_attorney"],
    ["关系证明", "relationship_proof"],
    ["身份证复印件", "id_copy"],
    ["其他", "other"]
  ].freeze

  validates :auth_type, presence: true, inclusion: { in: AUTH_TYPES.map(&:last) }
  validates :file_path, presence: true
  validates :receiver_name, presence: true
  validates :receiver_id_card, presence: true
end