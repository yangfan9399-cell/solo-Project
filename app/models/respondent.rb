class Respondent < ApplicationRecord
  self.inheritance_column = nil
  enum :type, { employee: 0, customer: 1, partner: 2, expert: 3, other: 4 }

  has_many :interviews
end