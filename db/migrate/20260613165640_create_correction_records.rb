class CreateCorrectionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :correction_records do |t|
      t.bigint :inspection_record_id
      t.bigint :workflow_node_id
      t.bigint :handler_id
      t.text :business_record
      t.text :site_description
      t.text :correction_measures
      t.datetime :correction_time
      t.text :basis

      t.timestamps
    end
    add_index :correction_records, :inspection_record_id
    add_index :correction_records, :workflow_node_id
    add_index :correction_records, :handler_id
  end
end
