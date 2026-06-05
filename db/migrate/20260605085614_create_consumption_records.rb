class CreateConsumptionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :consumption_records do |t|
      t.references :course_package, null: false, foreign_key: true
      t.string :service_name
      t.integer :sessions_used, default: 1
      t.references :performed_by, null: false, foreign_key: { to_table: :users }
      t.datetime :performed_at
      t.text :customer_notes
      t.string :record_type, default: 'normal'

      t.timestamps
    end
  end
end
