class CreateScaleMarkers < ActiveRecord::Migration[8.1]
  def change
    create_table :scale_markers do |t|
      t.references :record, null: false, foreign_key: true
      t.integer :x
      t.integer :y
      t.float :length_pixels
      t.float :length_cm
      t.string :orientation

      t.timestamps
    end
  end
end
