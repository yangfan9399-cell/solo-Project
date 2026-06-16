class CreateOperations < ActiveRecord::Migration[8.1]
  def change
    create_table :operations do |t|
      t.references :game_session, null: false, foreign_key: true
      t.references :container, null: false, foreign_key: true
      t.references :berth, foreign_key: true
      t.string :action_type, null: false
      t.integer :sequence, null: false
      t.datetime :timestamp
      t.boolean :undone, default: false

      t.timestamps
    end
    add_index :operations, [:game_session_id, :sequence]
  end
end
