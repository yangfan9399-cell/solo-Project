class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :username, null: false
      t.string :name, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "receptionist"

      t.timestamps
    end

    add_index :users, :username, unique: true
    add_index :users, :role
  end
end