class CreateVisitors < ActiveRecord::Migration[8.1]
  def change
    create_table :visitors do |t|
      t.string :name, null: false
      t.string :phone, null: false
      t.string :id_card_number
      t.string :company
      t.string :email
      t.timestamps
    end
    add_index :visitors, :phone
  end
end
