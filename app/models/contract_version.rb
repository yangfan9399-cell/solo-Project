class ContractVersion < ApplicationRecord
  belongs_to :contract

  validates :version_number, presence: true
  validates :file_url, presence: true
end