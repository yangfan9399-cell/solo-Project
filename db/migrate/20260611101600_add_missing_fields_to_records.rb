class AddMissingFieldsToRecords < ActiveRecord::Migration[8.0]
  def change
    add_column :repair_records, :location, :string
    add_column :repair_records, :notes, :text

    add_column :inspection_records, :remarks, :text

    add_column :fuel_records, :gas_station, :string
    add_column :fuel_records, :notes, :text
  end
end
