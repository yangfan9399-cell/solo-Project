class CreateContainerPlacements < ActiveRecord::Migration[8.1]
  def change
    create_table :container_placements do |t|
      t.references :game_session, null: false, foreign_key: true
      t.references :container, null: false, foreign_key: true
      t.references :berth, null: false, foreign_key: true
      t.datetime :placed_at

      t.timestamps
    end
    add_index :container_placements, [:game_session_id, :container_id], unique: true
    add_index :container_placements, [:game_session_id, :berth_id]
  end
end
