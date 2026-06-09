class CreateSealApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :seal_applications do |t|
      t.references :contract, null: false, foreign_key: true
      t.references :seal, null: false, foreign_key: true
      t.references :applicant, null: false, foreign_key: { to_table: :users }
      t.text :purpose
      t.integer :status
      t.integer :use_count
      t.boolean :version_conflict

      t.timestamps
    end
  end
end
