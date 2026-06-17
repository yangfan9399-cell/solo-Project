class CreatePageMappings < ActiveRecord::Migration[8.1]
  def change
    create_table :page_mappings do |t|
      t.references :project, null: false, foreign_key: true
      t.integer :pdf_page_index
      t.integer :actual_page_number
      t.string :status, default: "normal"
      t.text :notes

      t.timestamps
    end

    add_index :page_mappings, [:project_id, :pdf_page_index], unique: true
  end
end
