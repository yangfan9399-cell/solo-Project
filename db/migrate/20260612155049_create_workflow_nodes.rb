class CreateWorkflowNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :workflow_nodes do |t|
      t.references :fault_record, null: false, foreign_key: true
      t.integer :node_type, null: false, default: 0
      t.integer :from_status
      t.integer :to_status
      t.integer :operator_id
      t.integer :action_type, default: 0
      t.text :comment
      t.jsonb :snapshot_data, default: {}
      t.datetime :processed_at

      t.timestamps
    end
    add_index :workflow_nodes, :operator_id
    add_index :workflow_nodes, :node_type
    add_index :workflow_nodes, :to_status
    add_index :workflow_nodes, :processed_at
    add_index :workflow_nodes, :snapshot_data, using: :gin
  end
end
