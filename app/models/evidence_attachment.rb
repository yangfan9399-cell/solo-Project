class EvidenceAttachment < ApplicationRecord
  extend Enumerize

  enumerize :attachment_type, in: {
    before_photo: 'before_photo',
    after_photo: 'after_photo',
    video: 'video',
    document: 'document',
    other: 'other'
  }, default: :before_photo

  belongs_to :inspection_record
  belongs_to :workflow_node, optional: true
  belongs_to :uploader, class_name: 'User', optional: true

  has_one_attached :file

  validates :attachment_type, presence: true
  validates :description, presence: true
  validates :file, presence: true, on: :create

  scope :by_type, ->(type) { where(attachment_type: type) }
  scope :for_inspection, ->(record_id) { where(inspection_record_id: record_id) }
  scope :for_node, ->(node_id) { where(workflow_node_id: node_id) }

  before_save :set_file_info, if: :file_attached?

  def file_attached?
    file.attached?
  end

  def set_file_info
    self.file_name ||= file.filename.to_s
    self.file_size ||= file.byte_size
  end

  def type_text
    attachment_type&.text || '其他'
  end

  def uploader_name
    uploader&.name || '未知'
  end

  def file_url
    return nil unless file_attached?
    Rails.application.routes.url_helpers.rails_blob_url(file, only_path: true)
  end

  def thumbnail_url
    return nil unless file_attached? && file.image?
    Rails.application.routes.url_helpers.rails_representation_url(
      file.variant(resize_to_limit: [200, 200]),
      only_path: true
    )
  end

  def as_json(options = {})
    super(options).merge(
      file_url: file_url,
      thumbnail_url: thumbnail_url,
      uploader_name: uploader_name,
      type_text: type_text,
      is_image: attachment_type.in?(['before_photo', 'after_photo'])
    )
  end
end
