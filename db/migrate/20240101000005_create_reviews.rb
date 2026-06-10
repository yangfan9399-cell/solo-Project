class CreateReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :reviews do |t|
      t.references :application, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.string :review_type, null: false
      t.string :status, null: false
      t.text :comment

      t.timestamps
    end

    add_index :reviews, :application_id
    add_index :reviews, :reviewer_id
    add_index :reviews, :review_type
  end
end