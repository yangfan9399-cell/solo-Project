class CreateMaintenanceItems < ActiveRecord::Migration[8.1]
  def change
    create_table :maintenance_items do |t|
      t.references :maintenance_plan, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.boolean :is_required
      t.string :status
      t.string :completed_by
      t.datetime :completed_at

      t.timestamps
    end
  end
end
