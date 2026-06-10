class CreateReports < ActiveRecord::Migration[7.1]
  def change
    create_table :reports do |t|
      t.references :exam, null: false, foreign_key: true
      t.string :report_no, null: false
      t.date :issue_date, null: false
      t.string :status, null: false, default: "generated"
      t.string :pickup_type
      t.integer :reissue_count, default: 0
      t.text :remark

      t.timestamps
    end

    add_index :reports, :report_no, unique: true
    add_index :reports, :status
    add_index :reports, :issue_date
  end
end