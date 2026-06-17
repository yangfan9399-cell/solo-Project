class CreateComponentVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :component_versions do |t|
      t.references :component, null: false, foreign_key: true
      t.integer :version_number
      t.string :batch_tag
      t.string :event_type
      t.text :object_snapshot
      t.text :changed_fields
      t.string :operator
      t.text :notes
      t.datetime :recorded_at

      t.timestamps
    end
  end
end
