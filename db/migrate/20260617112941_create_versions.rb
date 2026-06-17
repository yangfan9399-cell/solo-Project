class CreateVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :versions do |t|
      t.references :rubbing, null: false, foreign_key: true
      t.string :version
      t.text :changelog
      t.string :changed_by
      t.string :batch

      t.timestamps
    end
  end
end
