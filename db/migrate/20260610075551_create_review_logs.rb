class CreateReviewLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :review_logs do |t|
      t.references :usage_scenario, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.string :review_type
      t.string :status
      t.text :comment
      t.datetime :reviewed_at

      t.timestamps
    end
  end
end