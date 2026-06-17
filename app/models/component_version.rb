class ComponentVersion < ApplicationRecord
  EVENT_TYPES = %w[create update status_change defect_added reassembly batch_import]

  belongs_to :component

  store :object_snapshot, accessors: %i[code component_type position orientation status notes], coder: JSON
  serialize :changed_fields, type: Array, coder: JSON

  scope :by_batch, ->(batch_tag) { where(batch_tag: batch_tag) }
  scope :by_event, ->(event_type) { where(event_type: event_type) }
  scope :latest_first, -> { order(version_number: :desc) }

  def snapshot_object
    object_snapshot
  end

  def changed_fields_list
    changed_fields
  end

  def previous_version
    component.component_versions.where("version_number < ?", version_number).order(version_number: :desc).first
  end

  def next_version
    component.component_versions.where("version_number > ?", version_number).order(version_number: :asc).first
  end
end
