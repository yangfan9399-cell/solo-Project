class ChangeHistory < ApplicationRecord
  belongs_to :interview
  belongs_to :user
end