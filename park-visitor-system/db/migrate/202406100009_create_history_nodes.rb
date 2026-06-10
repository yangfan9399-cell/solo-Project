class CreateHistoryNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :history_nodes do |t|
      t.references :visit_record, null: false, foreign_key: true
      t.string :action, null: false
      t.references :actor, polymorphic: true, null: false
      t.text :notes
      t.timestamps
    end
    add_index :history_nodes, :created_at
  end
end
