class CreateInspectionRecords < ActiveRecord::Migration[7.1]
  def change
    create_table :inspection_records do |t|
      t.references :return_order, null: false, foreign_key: true
      t.string :inspector_name
      t.string :condition
      t.integer :missing_items_count, default: 0
      t.text :damage_description
      t.jsonb :photos, default: []
      t.integer :quality_score
      t.string :final_decision

      t.timestamps
    end
  end
end
