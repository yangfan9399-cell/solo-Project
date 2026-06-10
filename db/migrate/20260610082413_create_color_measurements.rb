class CreateColorMeasurements < ActiveRecord::Migration[8.1]
  def change
    create_table :color_measurements do |t|
      t.references :proof, null: false, foreign_key: true
      t.decimal :l_value
      t.decimal :a_value
      t.decimal :b_value
      t.decimal :delta_e
      t.datetime :measured_at
      t.string :inspector
      t.boolean :is_qualified
      t.text :remark

      t.timestamps
    end
  end
end
