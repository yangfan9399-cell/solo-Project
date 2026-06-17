class CreateTrainRoutes < ActiveRecord::Migration[8.1]
  def change
    create_table :train_routes do |t|
      t.references :run_chart, null: false, foreign_key: true
      t.string :train_no
      t.string :train_type
      t.string :color
      t.text :path_data
      t.string :status

      t.timestamps
    end
  end
end
