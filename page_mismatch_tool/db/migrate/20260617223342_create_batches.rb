class CreateBatches < ActiveRecord::Migration[8.1]
  def change
    create_table :batches do |t|
      t.references :project, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.text :snapshot

      t.timestamps
    end
  end
end
