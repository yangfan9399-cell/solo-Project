class CreateContractVersions < ActiveRecord::Migration[8.0]
  def change
    create_table :contract_versions do |t|
      t.references :contract, null: false, foreign_key: true
      t.integer :version_number, null: false
      t.string :file_url, null: false
      t.text :changes

      t.timestamps
    end

    add_index :contract_versions, :contract_id
  end
end