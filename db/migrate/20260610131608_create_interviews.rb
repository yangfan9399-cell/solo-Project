class CreateInterviews < ActiveRecord::Migration[8.1]
  def change
    create_table :interviews do |t|
      t.string :title
      t.string :content
      t.integer :status
      t.datetime :publish_date
      t.integer :channel
      t.references :user, null: false, foreign_key: true
      t.references :respondent, null: false, foreign_key: true

      t.timestamps
    end
  end
end
