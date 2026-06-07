class CreateReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :reviews do |t|
      t.references :sample, null: false, foreign_key: true
      t.references :sample_version, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.integer :verdict, null: false, default: 0
      t.text :feedback
      t.jsonb :issues, default: []

      t.timestamps
    end
    add_index :reviews, :verdict
  end
end
