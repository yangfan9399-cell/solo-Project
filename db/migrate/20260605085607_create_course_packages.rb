class CreateCoursePackages < ActiveRecord::Migration[8.1]
  def change
    create_table :course_packages do |t|
      t.references :member, null: false, foreign_key: true
      t.references :consultant, null: false, foreign_key: { to_table: :users }
      t.string :name
      t.decimal :original_price, precision: 10, scale: 2
      t.integer :total_sessions
      t.integer :remaining_sessions
      t.datetime :purchased_at
      t.string :status, default: 'active'
      t.text :notes

      t.timestamps
    end
  end
end
