class CreateVehicleModels < ActiveRecord::Migration[8.1]
  def change
    create_table :vehicle_models do |t|
      t.string :name
      t.string :brand
      t.string :category
      t.decimal :fuel_tank_capacity
      t.decimal :standard_fuel_consumption
      t.integer :maintenance_km_interval
      t.integer :maintenance_day_interval

      t.timestamps
    end
  end
end
