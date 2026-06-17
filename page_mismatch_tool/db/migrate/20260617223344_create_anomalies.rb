class CreateAnomalies < ActiveRecord::Migration[8.1]
  def change
    create_table :anomalies do |t|
      t.references :project, null: false, foreign_key: true
      t.references :page_mapping, null: true, foreign_key: true
      t.string :anomaly_type
      t.text :description
      t.boolean :resolved, default: false

      t.timestamps
    end
  end
end
