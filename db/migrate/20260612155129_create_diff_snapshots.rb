class CreateDiffSnapshots < ActiveRecord::Migration[8.1]
  def change
    create_table :diff_snapshots do |t|
      t.references :fault_record, null: false, foreign_key: true
      t.references :workflow_node, null: false, foreign_key: true
      t.string :field_name, null: false
      t.text :before_value
      t.text :after_value
      t.integer :diff_type, default: 0

      t.timestamps
    end
    add_index :diff_snapshots, :field_name
    add_index :diff_snapshots, :diff_type
  end
end
