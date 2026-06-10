class CreateLicenses < ActiveRecord::Migration[8.1]
  def change
    create_table :licenses do |t|
      t.references :material, null: false, foreign_key: true
      t.string :licensor
      t.string :license_type
      t.date :start_date
      t.date :end_date
      t.text :authorized_channels
      t.string :contract_file
      t.string :status
      t.string :risk_reason

      t.timestamps
    end
  end
end
