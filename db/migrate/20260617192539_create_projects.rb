class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name
      t.string :code
      t.string :location
      t.string :dynasty
      t.text :description
      t.string :status
      t.date :start_date
      t.date :end_date

      t.timestamps
    end
  end
end
