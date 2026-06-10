class CreateVisitRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :visit_records do |t|
      t.references :reservation, null: false, foreign_key: true
      t.datetime :actual_entry_at
      t.datetime :actual_exit_at
      t.references :entry_guard, foreign_key: { to_table: :employees }
      t.references :exit_guard, foreign_key: { to_table: :employees }
      t.references :entry_entrance, foreign_key: { to_table: :entrances }
      t.references :exit_entrance, foreign_key: { to_table: :entrances }
      t.integer :status, default: 0
      t.text :blocking_reason
      t.references :supervisor, foreign_key: { to_table: :employees }
      t.timestamps
    end
    add_index :visit_records, :status
  end
end
