class CreateMaintenancePlans < ActiveRecord::Migration[8.1]
  def change
    create_table :maintenance_plans do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.date :planned_date
      t.decimal :scheduled_mileage
      t.string :maintenance_type
      t.string :status
      t.string :scheduled_by
      t.text :notes
      t.datetime :completed_at

      t.timestamps
    end
  end
end
