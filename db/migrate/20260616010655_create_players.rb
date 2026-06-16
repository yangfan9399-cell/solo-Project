class CreatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :players do |t|
      t.string :name, null: false
      t.integer :current_score, default: 0
      t.integer :total_games, default: 0
      t.integer :wins, default: 0

      t.timestamps
    end
    add_index :players, :name, unique: true
  end
end
