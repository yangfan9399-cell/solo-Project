class CreateFollowUps < ActiveRecord::Migration[8.0]
  def change
    create_table :follow_ups do |t|
      t.references :repair_order, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.datetime :follow_up_at
      t.string :contact_method
      t.string :satisfaction
      t.text :feedback
      t.text :notes
      t.boolean :completed, default: false

      t.timestamps
    end
  end
end
