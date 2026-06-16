class CreateOperationHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :operation_histories do |t|
      t.references :game_session, null: false, foreign_key: true
      t.string :operation_type, null: false
      t.string :gear_id
      t.text :from_state
      t.text :to_state
      t.integer :move_number, default: 0
      t.boolean :undone, default: false

      t.timestamps
    end
  end
end
