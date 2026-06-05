class CreateResponsibilityChanges < ActiveRecord::Migration[8.1]
  def change
    create_table :responsibility_changes do |t|
      t.references :course_package, null: false, foreign_key: true
      t.references :from_consultant, null: false, foreign_key: { to_table: :users }
      t.references :to_consultant, null: false, foreign_key: { to_table: :users }
      t.references :transferred_by, null: false, foreign_key: { to_table: :users }
      t.text :transfer_reason
      t.datetime :transferred_at

      t.timestamps
    end
  end
end
