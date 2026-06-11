class CreateHistoryNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :history_nodes do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.string :node_type
      t.string :title
      t.text :description
      t.string :operator
      t.string :operator_role
      t.datetime :happened_at
      t.jsonb :metadata

      t.timestamps
    end
  end
end
