class CreateCrews < ActiveRecord::Migration[8.1]
  def change
    create_table :crews do |t|
      t.string :name, null: false
      t.string :play_name
      t.text :description
      t.references :leader, foreign_key: { to_table: :users }
      t.date :start_date
      t.date :end_date

      t.timestamps
    end
  end
end
