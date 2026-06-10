class Customer < ApplicationRecord
  has_many :work_orders, dependent: :destroy
end