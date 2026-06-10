class Interview < ApplicationRecord
  enum :status, { draft: 0, pending_brand_review: 1, pending_legal_review: 2, pending_publish: 3, published: 4, rejected: 5 }
  enum :channel, { website: 0, wechat: 1, weibo: 2, douyin: 3, xiaohongshu: 4, other: 5 }

  belongs_to :user
  belongs_to :respondent
  has_one :authorization
  has_many :sensitive_items
  has_many :review_records, -> { order(created_at: :asc) }
  has_many :change_histories, -> { order(created_at: :desc) }

  def authorized?
    authorization&.approved?
  end

  def has_uncovered_sensitive_items?
    sensitive_items.exists?(covered: false)
  end

  def can_publish?
    authorized? && !has_uncovered_sensitive_items? && pending_publish?
  end

  def last_review_record
    review_records.last
  end

  def review_stage
    return :brand if draft? || pending_brand_review?
    return :legal if pending_legal_review?
    return :publish if pending_publish?
    return :completed if published? || rejected?
  end
end