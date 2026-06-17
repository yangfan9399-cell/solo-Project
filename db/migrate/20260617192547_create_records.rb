class CreateRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :records do |t|
      t.references :project, null: false, foreign_key: true
      t.string :batch_number
      t.date :record_date
      t.string :photographer
      t.string :observer
      t.string :weather
      t.float :temperature
      t.float :humidity
      t.string :image_url
      t.text :notes
      t.string :version_type

      t.timestamps
    end
  end
end
