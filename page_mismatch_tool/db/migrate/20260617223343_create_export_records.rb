class CreateExportRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :export_records do |t|
      t.references :project, null: false, foreign_key: true
      t.references :batch, null: true, foreign_key: true
      t.string :format
      t.string :filename
      t.text :content

      t.timestamps
    end
  end
end
