class CreateInspectionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :inspection_records do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.string :inspector
      t.datetime :inspection_date
      t.string :inspection_type
      t.string :brakes_status
      t.string :tires_status
      t.string :lights_status
      t.string :steering_status
      t.string :oil_status
      t.string :water_status
      t.string :cleaning_status
      t.string :overall_result
      t.text :issues_found
      t.text :suggestions

      t.timestamps
    end
  end
end
