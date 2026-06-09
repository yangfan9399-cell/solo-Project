class CreateLinenEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :linen_events do |t|
      t.references :linen_batch, null: false, foreign_key: true
      t.string :event_type
      t.references :user, null: false, foreign_key: true
      t.text :description

      t.timestamps
    end
    add_index :linen_events, :event_type
    add_index :linen_events, [:linen_batch_id, :created_at]
  end
end
