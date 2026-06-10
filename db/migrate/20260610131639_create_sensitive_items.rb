class CreateSensitiveItems < ActiveRecord::Migration[8.1]
  def change
    create_table :sensitive_items do |t|
      t.references :interview, null: false, foreign_key: true
      t.string :content
      t.string :position
      t.integer :start_index
      t.integer :end_index
      t.boolean :covered

      t.timestamps
    end
  end
end
