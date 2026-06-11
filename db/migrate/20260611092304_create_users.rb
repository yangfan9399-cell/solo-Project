class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name
      t.string :employee_id
      t.string :role
      t.string :phone
      t.string :department
      t.string :status

      t.timestamps
    end
    add_index :users, :employee_id, unique: true
  end
end
