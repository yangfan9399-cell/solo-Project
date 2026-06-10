class CreateAuthorizations < ActiveRecord::Migration[8.1]
  def change
    create_table :authorizations do |t|
      t.references :interview, null: false, foreign_key: true
      t.string :file_path
      t.boolean :approved
      t.datetime :approved_at
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
