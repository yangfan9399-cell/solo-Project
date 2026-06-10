class Patient < ApplicationRecord
  has_many :exams, dependent: :destroy
  has_many :reports, through: :exams

  validates :name, presence: true
  validates :id_card, presence: true, uniqueness: true
  validates :phone, presence: true

  def self.search(query)
    where("name LIKE ? OR id_card LIKE ? OR phone LIKE ?", 
          "%#{query}%", "%#{query}%", "%#{query}%")
  end
end