class CreateAuthorizations < ActiveRecord::Migration[7.1]
  def change
    create_table :authorizations do |t|
      t.references :report, null: false, foreign_key: true
      t.string :auth_type, null: false
      t.string :file_path, null: false
      t.string :receiver_name, null: false
      t.string :receiver_id_card, null: false
      t.text :remark

      t.timestamps
    end

    add_index :authorizations, [:report_id, :auth_type]
  end
end