class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :username, null: false, index: { unique: true }
      t.string :name
      t.string :role
      t.string :department
      t.string :phone
      t.string :email
      t.string :password_digest

      t.timestamps
    end
  end
end
