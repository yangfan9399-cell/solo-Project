class CreateGameSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :game_sessions do |t|
      t.references :player, null: false, foreign_key: true
      t.references :level, null: false, foreign_key: true
      t.string :status, default: 'playing'
      t.float :current_rpm, default: 0.0
      t.integer :moves_count, default: 0
      t.integer :time_spent, default: 0
      t.text :gears_state
      t.integer :score, default: 0
      t.integer :stars, default: 0
      t.datetime :completed_at

      t.timestamps
    end
  end
end
