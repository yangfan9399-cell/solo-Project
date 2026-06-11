class CreateTripRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :trip_records do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.references :route, null: false, foreign_key: true
      t.datetime :planned_departure_time
      t.datetime :actual_departure_time
      t.datetime :planned_return_time
      t.datetime :actual_return_time
      t.decimal :start_mileage
      t.decimal :end_mileage
      t.string :driver_name
      t.string :reviewer
      t.string :review_status
      t.text :review_note
      t.datetime :reviewed_at
      t.boolean :is_active

      t.timestamps
    end
  end
end
