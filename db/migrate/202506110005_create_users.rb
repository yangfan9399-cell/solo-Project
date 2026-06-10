class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :employee_id, null: false, unique: true
      t.references :store, foreign_key: true
      t.string :role, null: false # store_manager, warehouse_dispatcher, finance_reviewer
      t.string :email
      t.string :phone
      t.timestamps
    end
  end
end
