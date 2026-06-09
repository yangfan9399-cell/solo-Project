class CreateContracts < ActiveRecord::Migration[8.1]
  def change
    create_table :contracts do |t|
      t.string :title
      t.text :content
      t.string :version
      t.references :applicant, null: false, foreign_key: { to_table: :users }
      t.references :department, null: false, foreign_key: true

      t.timestamps
    end
    add_index :contracts, :version
  end
end
