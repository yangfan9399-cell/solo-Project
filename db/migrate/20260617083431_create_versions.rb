class CreateVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :versions do |t|
      t.references :project, null: false, foreign_key: true
      t.references :run_chart, null: false, foreign_key: true
      t.string :batch_no
      t.string :version_no
      t.text :change_log
      t.string :export_path
      t.datetime :exported_at
      t.string :status

      t.timestamps
    end
  end
end
