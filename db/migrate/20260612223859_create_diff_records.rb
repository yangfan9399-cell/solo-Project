class CreateDiffRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :diff_records do |t|
      t.references :grade_correction, null: false, foreign_key: true
      t.references :processing_node, null: false, foreign_key: true
      t.string :field_name
      t.text :old_value
      t.text :new_value
      t.references :operator, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
