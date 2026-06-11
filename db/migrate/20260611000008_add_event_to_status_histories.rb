class AddEventToStatusHistories < ActiveRecord::Migration[7.1]
  def change
    add_column :status_histories, :event, :string
  end
end
