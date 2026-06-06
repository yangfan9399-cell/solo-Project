class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.integer :role, null: false, default: 0
      t.string :phone
      t.string :email

      t.timestamps
    end
    add_index :users, :role
  end
end
