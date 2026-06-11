class CreateVehicles < ActiveRecord::Migration[8.1]
  def change
    create_table :vehicles do |t|
      t.string :plate_number
      t.string :vin_number
      t.references :fleet, null: false, foreign_key: true
      t.references :vehicle_model, null: false, foreign_key: true
      t.references :route, null: false, foreign_key: true
      t.date :manufacture_date
      t.date :purchase_date
      t.decimal :current_mileage
      t.string :status
      t.date :last_maintenance_date
      t.date :next_maintenance_date
      t.string :driver_name
      t.text :remarks

      t.timestamps
    end
    add_index :vehicles, :plate_number, unique: true
  end
end
