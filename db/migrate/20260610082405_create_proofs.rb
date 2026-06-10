class CreateProofs < ActiveRecord::Migration[8.1]
  def change
    create_table :proofs do |t|
      t.references :work_order, null: false, foreign_key: true
      t.integer :version
      t.string :sample_image
      t.datetime :submitted_at
      t.string :submitter
      t.string :status

      t.timestamps
    end
  end
end
