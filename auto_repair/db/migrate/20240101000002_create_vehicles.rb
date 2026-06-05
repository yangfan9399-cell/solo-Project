class CreateVehicles < ActiveRecord::Migration[8.0]
  def change
    create_table :vehicles do |t|
      t.string :plate_number, null: false
      t.string :vin
      t.string :brand
      t.string :model
      t.string :color
      t.integer :year
      t.integer :mileage
      t.string :owner_name
      t.string :owner_phone

      t.timestamps
    end
    add_index :vehicles, :plate_number, unique: true
  end
end
