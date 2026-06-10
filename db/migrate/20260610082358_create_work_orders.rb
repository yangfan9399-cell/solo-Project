class CreateWorkOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :work_orders do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :category
      t.string :target_color
      t.string :paper_type
      t.string :status
      t.string :machine
      t.string :responsible_person
      t.text :remark

      t.timestamps
    end
  end
end
