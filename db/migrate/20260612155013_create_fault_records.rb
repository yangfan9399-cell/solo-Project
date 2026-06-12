class CreateFaultRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :fault_records do |t|
      t.string :ticket_no, null: false
      t.integer :source_type, null: false, default: 0
      t.string :line_name
      t.string :station_name
      t.string :platform_door_no
      t.integer :fault_type, default: 0
      t.integer :fault_level, default: 0
      t.text :fault_description
      t.datetime :reported_at
      t.integer :current_status, null: false, default: 0
      t.integer :current_owner_id
      t.integer :reported_by_id
      t.string :responsible_unit
      t.string :responsible_person
      t.datetime :maintenance_window_start
      t.datetime :maintenance_window_end
      t.datetime :actual_start_at
      t.datetime :actual_end_at
      t.decimal :estimated_cost, precision: 12, scale: 2, default: 0
      t.decimal :actual_cost, precision: 12, scale: 2, default: 0
      t.boolean :notified_confirmation, default: false
      t.boolean :handler_qualified, default: true
      t.text :on_site_description
      t.text :business_record
      t.text :conclusion
      t.text :basis_doc
      t.integer :abnormal_type, default: 0
      t.text :blocking_reason
      t.text :remediation_path
      t.boolean :is_archived, null: false, default: false

      t.timestamps
    end
    add_index :fault_records, :ticket_no, unique: true
    add_index :fault_records, :current_status
    add_index :fault_records, :current_owner_id
    add_index :fault_records, :reported_by_id
    add_index :fault_records, :is_archived
    add_index :fault_records, :abnormal_type
    add_index :fault_records, [:line_name, :station_name]
    add_index :fault_records, :reported_at
  end
end
