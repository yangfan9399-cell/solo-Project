class CreateHotels < ActiveRecord::Migration[8.1]
  def change
    create_table :hotels do |t|
      t.string :name
      t.string :address
      t.string :contact_person
      t.string :phone

      t.timestamps
    end
  end
end
