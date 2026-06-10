class CreateApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :applications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :track, null: false, foreign_key: true
      t.string :client_name, null: false
      t.string :client_industry
      t.string :client_contact
      t.string :usage_scenario, null: false
      t.string :territory, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.string :status, null: false, default: "draft"
      t.text :rejection_reason
      t.decimal :budget, precision: 12, scale: 2
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :applications, :user_id
    add_index :applications, :track_id
    add_index :applications, :status
    add_index :applications, [:start_date, :end_date]
  end
end