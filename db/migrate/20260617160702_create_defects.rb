class CreateDefects < ActiveRecord::Migration[8.1]
  def change
    create_table :defects do |t|
      t.references :component, null: false, foreign_key: true
      t.string :defect_type
      t.string :severity
      t.text :description
      t.string :measured_size
      t.string :location_on_component
      t.date :discovered_at
      t.boolean :repaired
      t.date :repaired_at
      t.text :repair_notes

      t.timestamps
    end
  end
end
