class CreateRunCharts < ActiveRecord::Migration[8.1]
  def change
    create_table :run_charts do |t|
      t.references :project, null: false, foreign_key: true
      t.string :name
      t.string :image_path
      t.float :scale_x
      t.float :scale_y
      t.float :offset_x
      t.float :offset_y
      t.date :date

      t.timestamps
    end
  end
end
