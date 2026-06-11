class CreateAnchors < ActiveRecord::Migration[7.1]
  def change
    create_table :anchors do |t|
      t.string :name
      t.string :avatar_url

      t.timestamps
    end
  end
end
