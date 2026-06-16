class CreateGameSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :game_sessions do |t|
      t.references :player, null: false, foreign_key: true
      t.references :level, null: false, foreign_key: true
      t.integer :score, default: 0
      t.datetime :started_at
      t.datetime :finished_at
      t.string :status, default: 'playing'
      t.integer :time_remaining

      t.timestamps
    end
    add_index :game_sessions, :status
    add_index :game_sessions, [:player_id, :status]
  end
end
