class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :name, null: false
      t.string :employee_number, null: false
      t.references :department, null: false, foreign_key: true
      t.string :phone
      t.string :email
      t.string :position
      t.boolean :is_security_guard, default: false
      t.boolean :is_security_supervisor, default: false
      t.timestamps
    end
    add_index :employees, :employee_number, unique: true
  end
end
