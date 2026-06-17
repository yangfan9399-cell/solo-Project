class CreateRubbings < ActiveRecord::Migration[8.1]
  def change
    create_table :rubbings do |t|
      t.string :no
      t.string :title
      t.string :dynasty
      t.string :location
      t.string :dating
      t.string :image
      t.string :image_thumb
      t.string :status
      t.string :checksum
      t.text :remarks
      t.string :created_by

      t.timestamps
    end
  end
end
