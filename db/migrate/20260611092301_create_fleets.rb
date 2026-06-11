class CreateFleets < ActiveRecord::Migration[8.1]
  def change
    create_table :fleets do |t|
      t.string :name
      t.string :code
      t.string :contact
      t.string :phone

      t.timestamps
    end
  end
end
