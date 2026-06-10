class CreateReservations < ActiveRecord::Migration[8.1]
  def change
    create_table :reservations do |t|
      t.references :visitor, null: false, foreign_key: true
      t.references :vehicle, null: false, foreign_key: true
      t.references :host, null: false, foreign_key: { to_table: :employees }
      t.references :entrance, null: false, foreign_key: true
      t.datetime :scheduled_at, null: false
      t.datetime :scheduled_end_at
      t.text :purpose, null: false
      t.integer :status, default: 0
      t.text :host_notes
      t.timestamps
    end
    add_index :reservations, :status
    add_index :reservations, :scheduled_at
  end
end
