class CreateWorkOrderHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :work_order_histories do |t|
      t.references :work_order, null: false, foreign_key: true
      t.string :previous_status
      t.string :current_status
      t.string :operator
      t.string :action
      t.text :remark
      t.timestamps
    end
  end
end
