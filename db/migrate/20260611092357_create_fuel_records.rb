class CreateFuelRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :fuel_records do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.date :record_date
      t.decimal :start_mileage
      t.decimal :end_mileage
      t.decimal :fuel_amount
      t.decimal :fuel_cost
      t.decimal :fuel_consumption
      t.boolean :is_abnormal
      t.string :abnormal_note
      t.string :recorded_by

      t.timestamps
    end
  end
end
