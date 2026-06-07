class CreateSamples < ActiveRecord::Migration[8.1]
  def change
    create_table :samples do |t|
      t.string :style_number, null: false
      t.string :category, null: false
      t.text :description
      t.text :fabric
      t.jsonb :size_chart, default: {}
      t.integer :status, null: false, default: 0
      t.integer :version_count, null: false, default: 0
      t.references :designer, null: false, foreign_key: { to_table: :users }
      t.references :pattern_maker, foreign_key: { to_table: :users }
      t.references :current_owner, foreign_key: { to_table: :users }
      t.boolean :supervisor_confirmation_required, null: false, default: false
      t.boolean :supervisor_confirmed, null: false, default: false
      t.datetime :submitted_at
      t.datetime :finalized_at

      t.timestamps
    end
    add_index :samples, :style_number, unique: true
    add_index :samples, :category
    add_index :samples, :status
  end
end
