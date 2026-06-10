class CreateContracts < ActiveRecord::Migration[8.0]
  def change
    create_table :contracts do |t|
      t.references :application, null: false, foreign_key: true
      t.string :contract_number, null: false
      t.string :status, null: false, default: "draft"
      t.date :signed_date

      t.timestamps
    end

    add_index :contracts, :application_id
    add_index :contracts, :contract_number, unique: true
    add_index :contracts, :status
  end
end