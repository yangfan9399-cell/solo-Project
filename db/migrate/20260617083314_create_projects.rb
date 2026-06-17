class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name
      t.string :code
      t.text :description
      t.string :status
      t.string :created_by
      t.string :department

      t.timestamps
    end
  end
end
