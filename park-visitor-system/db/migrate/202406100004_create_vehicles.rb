class CreateVehicles < ActiveRecord::Migration[8.1]
  def change
    create_table :vehicles do |t|
      t.string :license_plate, null: false
      t.string :vehicle_type, default: 'car'
      t.string :color
      t.references :visitor, null: false, foreign_key: true
      t.timestamps
    end
    add_index :vehicles, :license_plate, unique: true
  end
end
