class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|
      t.string :name
      t.string :contact
      t.string :phone
      t.string :email

      t.timestamps
    end
  end
end
