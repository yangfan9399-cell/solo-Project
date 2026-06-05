class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :phone
      t.string :role, null: false

      t.timestamps
    end
  end
end
