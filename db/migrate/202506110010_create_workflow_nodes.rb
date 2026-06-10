class CreateWorkflowNodes < ActiveRecord::Migration[8.0]
  def change
    create_table :workflow_nodes do |t|
      t.references :trackable, polymorphic: true, null: false
      t.string :node_type, null: false # warning, allocation_created, allocation_approved, in_transit, received, rejected, loss_report_created, loss_report_approved
      t.references :actor, foreign_key: { to_table: :users }
      t.jsonb :metadata, default: {}
      t.timestamps
    end
  end
end
