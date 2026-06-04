class StatusLog < ApplicationRecord
  belongs_to :repair_request
  belongs_to :changed_by, class_name: "User"

  validates :to_status, presence: true
  validates :changed_by, presence: true

  after_create :broadcast_update

  private

  def broadcast_update
    Turbo::StreamsChannel.broadcast_replace_to(
      "repair_request_#{repair_request_id}",
      target: "status_timeline",
      partial: "repair_requests/status_timeline",
      locals: { repair_request: repair_request }
    )
  end
end
