class CreateRepairRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :repair_records do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.date :report_date
      t.date :start_date
      t.date :end_date
      t.string :repair_type
      t.text :issue_description
      t.text :diagnosis
      t.text :solution
      t.decimal :parts_cost
      t.decimal :labor_cost
      t.decimal :total_cost
      t.string :status
      t.string :technician
      t.string :repair_station
      t.boolean :is_urgent
      t.integer :decommission_days
      t.string :abnormal_reason

      t.timestamps
    end
  end
end
