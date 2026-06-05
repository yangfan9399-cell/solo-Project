class CreateRepairLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :repair_logs do |t|
      t.references :repair_order, null: false, foreign_key: true
      t.references :technician, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.datetime :started_at
      t.datetime :completed_at
      t.string :status, default: 'in_progress'

      t.timestamps
    end
  end
end
