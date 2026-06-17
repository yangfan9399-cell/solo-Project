class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name
      t.text :description
      t.string :pdf_filename
      t.integer :total_pages
      t.string :status, default: "draft"

      t.timestamps
    end

    add_index :projects, :status
  end
end
