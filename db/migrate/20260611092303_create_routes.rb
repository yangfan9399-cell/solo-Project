class CreateRoutes < ActiveRecord::Migration[8.1]
  def change
    create_table :routes do |t|
      t.string :name
      t.string :code
      t.decimal :distance
      t.integer :estimated_duration
      t.string :area

      t.timestamps
    end
  end
end
