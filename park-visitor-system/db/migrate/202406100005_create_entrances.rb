class CreateEntrances < ActiveRecord::Migration[8.1]
  def change
    create_table :entrances do |t|
      t.string :name, null: false
      t.string :location
      t.string :gate_type, default: 'main'
      t.boolean :is_active, default: true
      t.timestamps
    end
  end
end
