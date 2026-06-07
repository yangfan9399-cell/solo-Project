class CreateIssueTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :issue_types do |t|
      t.string :name, null: false
      t.string :category, null: false

      t.timestamps
    end
    add_index :issue_types, [:name, :category], unique: true
  end
end
