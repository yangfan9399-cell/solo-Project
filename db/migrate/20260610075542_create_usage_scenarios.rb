class CreateUsageScenarios < ActiveRecord::Migration[8.1]
  def change
    create_table :usage_scenarios do |t|
      t.references :material, null: false, foreign_key: true
      t.references :license, foreign_key: true
      t.string :column_name
      t.string :channel
      t.text :usage_scope
      t.references :bound_by, null: false, foreign_key: { to_table: :users }
      t.string :status
      t.string :approval_status

      t.timestamps
    end
  end
end