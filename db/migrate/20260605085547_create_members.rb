class CreateMembers < ActiveRecord::Migration[8.1]
  def change
    create_table :members do |t|
      t.string :name
      t.string :phone
      t.string :email

      t.timestamps
    end
  end
end
