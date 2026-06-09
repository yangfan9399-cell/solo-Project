class CreateApprovalNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :approval_nodes do |t|
      t.references :seal_application, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role
      t.integer :status
      t.text :comment

      t.timestamps
    end
  end
end
