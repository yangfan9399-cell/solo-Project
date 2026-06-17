class CreateReassemblyRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :reassembly_records do |t|
      t.references :component, null: false, foreign_key: true
      t.string :checked_by
      t.datetime :checked_at
      t.string :result
      t.string :position_deviation
      t.text :notes
      t.boolean :verified

      t.timestamps
    end
  end
end
