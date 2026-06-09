class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name
      t.string :role

      t.timestamps
    end
    add_index :users, :role
    add_index :users, :name, unique: true
  end
end
