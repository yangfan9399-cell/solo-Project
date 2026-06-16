class ChangeGearIdToStringInOperationHistories < ActiveRecord::Migration[8.1]
  def change
    change_column :operation_histories, :gear_id, :string
  end
end
