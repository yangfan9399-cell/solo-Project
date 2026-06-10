class CreateChangeHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :change_histories do |t|
      t.references :interview, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.json :changed_fields
      t.json :previous_values
      t.json :new_values
      t.string :comment

      t.timestamps
    end
  end
end
