class CreatePatients < ActiveRecord::Migration[7.1]
  def change
    create_table :patients do |t|
      t.string :name, null: false
      t.string :id_card, null: false
      t.string :phone, null: false
      t.date :birth_date
      t.string :gender
      t.string :address

      t.timestamps
    end

    add_index :patients, :id_card, unique: true
    add_index :patients, :phone
  end
end