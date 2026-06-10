class Contract < ApplicationRecord
  belongs_to :application
  has_many :contract_versions

  enum status: {
    draft: "draft",
    pending_signature: "pending_signature",
    signed: "signed",
    archived: "archived"
  }

  validates :contract_number, presence: true, uniqueness: true

  before_create :generate_contract_number

  private

  def generate_contract_number
    self.contract_number = "CT#{Time.current.strftime('%Y%m%d')}#{SecureRandom.hex(4).upcase}"
  end
end