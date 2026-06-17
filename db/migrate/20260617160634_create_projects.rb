class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name
      t.string :code
      t.string :location
      t.string :building_type
      t.string :era
      t.string :status
      t.text :description
      t.date :started_at
      t.date :completed_at

      t.timestamps
    end
  end
end
