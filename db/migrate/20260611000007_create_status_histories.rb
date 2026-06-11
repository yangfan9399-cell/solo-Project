class CreateStatusHistories < ActiveRecord::Migration[7.1]
  def change
    create_table :status_histories do |t|
      t.references :return_order, null: false, foreign_key: true
      t.string :from_status
      t.string :to_status
      t.string :operator_name
      t.text :note

      t.timestamps
    end
  end
end
