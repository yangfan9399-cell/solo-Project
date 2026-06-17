class CreateExports < ActiveRecord::Migration[8.1]
  def change
    create_table :exports do |t|
      t.references :project, null: false, foreign_key: true
      t.string :format
      t.text :record_ids
      t.datetime :generated_at
      t.string :file_path

      t.timestamps
    end
  end
end
