class CreateCustomerNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_notes do |t|
      t.references :course_package, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.text :content
      t.string :note_type, default: 'general'

      t.timestamps
    end
  end
end
