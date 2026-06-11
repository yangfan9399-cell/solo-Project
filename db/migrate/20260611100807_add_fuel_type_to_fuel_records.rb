class AddFuelTypeToFuelRecords < ActiveRecord::Migration[8.1]
  def change
    add_column :fuel_records, :fuel_type, :string
  end
end
