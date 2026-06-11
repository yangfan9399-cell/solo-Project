class CreateLiveSessions < ActiveRecord::Migration[7.1]
  def change
    create_table :live_sessions do |t|
      t.references :anchor, null: false, foreign_key: true
      t.string :title
      t.datetime :started_at
      t.datetime :ended_at

      t.timestamps
    end
  end
end
