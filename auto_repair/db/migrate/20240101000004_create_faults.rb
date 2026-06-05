class CreateFaults < ActiveRecord::Migration[8.0]
  def change
    create_table :faults do |t|
      t.references :repair_order, null: false, foreign_key: true
      t.references :reported_by, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.string :severity
      t.string :category

      t.timestamps
    end
  end
end
