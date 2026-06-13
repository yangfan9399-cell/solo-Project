class CreateWorkflowNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :workflow_nodes do |t|
      t.bigint :inspection_record_id
      t.string :from_state
      t.string :to_state
      t.string :event
      t.bigint :operator_id
      t.text :remark
      t.string :node_type
      t.jsonb :diff_fields

      t.timestamps
    end
    add_index :workflow_nodes, :inspection_record_id
    add_index :workflow_nodes, :operator_id
  end
end
