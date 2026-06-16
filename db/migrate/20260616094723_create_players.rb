class CreatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :players do |t|
      t.string :name, null: false
      t.string :password_digest
      t.integer :total_score, default: 0
      t.integer :total_stars, default: 0

      t.timestamps
    end
    add_index :players, :name, unique: true
  end
end
