class CreateReviewNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :review_nodes do |t|
      t.references :course_package, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.string :status, default: 'pending'
      t.decimal :refund_amount, precision: 10, scale: 2
      t.string :refund_algorithm
      t.decimal :old_refund_amount, precision: 10, scale: 2
      t.decimal :new_refund_amount, precision: 10, scale: 2
      t.text :dispute_reason
      t.text :review_notes
      t.datetime :reviewed_at
      t.references :parent_node, null: true, foreign_key: { to_table: :review_nodes }

      t.timestamps
    end
  end
end
