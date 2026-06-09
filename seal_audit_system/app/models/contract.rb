class Contract < ApplicationRecord
  belongs_to :applicant, class_name: 'User'
  belongs_to :department
  has_many :seal_applications

  validates :title, presence: true
  validates :content, presence: true
  validates :version, presence: true

  def latest_version?
    Contract.where(title: title).order(created_at: :desc).first == self
  end

  def version_history
    Contract.where(title: title).order(created_at: :desc)
  end
end
