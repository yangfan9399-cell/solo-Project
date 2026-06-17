class CreateStations < ActiveRecord::Migration[8.1]
  def change
    create_table :stations do |t|
      t.references :train_route, null: false, foreign_key: true
      t.string :name
      t.time :arrival_time
      t.time :departure_time
      t.float :x_coordinate
      t.float :y_coordinate
      t.integer :stop_duration
      t.integer :order

      t.timestamps
    end
  end
end
