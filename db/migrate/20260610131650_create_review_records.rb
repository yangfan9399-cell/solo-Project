class CreateReviewRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :review_records do |t|
      t.references :interview, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.integer :stage
      t.integer :status
      t.string :comment
      t.timestamps
    end
  end
end
