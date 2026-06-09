class CreateArchives < ActiveRecord::Migration[8.1]
  def change
    create_table :archives do |t|
      t.references :seal_application, null: false, foreign_key: true
      t.string :file_name
      t.integer :page_count
      t.integer :missing_pages
      t.references :auditor, null: false, foreign_key: { to_table: :users }
      t.integer :status

      t.timestamps
    end
  end
end
