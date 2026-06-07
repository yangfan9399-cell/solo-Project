class CreateSampleVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :sample_versions do |t|
      t.references :sample, null: false, foreign_key: true
      t.integer :version_number, null: false, default: 1
      t.text :description
      t.text :fabric
      t.jsonb :size_chart, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :sample_versions, [:sample_id, :version_number], unique: true
  end
end
