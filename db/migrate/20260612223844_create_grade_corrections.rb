class CreateGradeCorrections < ActiveRecord::Migration[8.1]
  def change
    create_table :grade_corrections do |t|
      t.string :application_no
      t.string :student_name
      t.string :student_id
      t.string :course_name
      t.string :course_code
      t.decimal :original_score
      t.decimal :corrected_score
      t.text :application_reason
      t.string :source
      t.string :applicant
      t.date :application_date
      t.references :current_owner, foreign_key: { to_table: :users }
      t.string :status
      t.text :conclusion
      t.text :block_reason
      t.text :remedy_path
      t.string :evidence_conclusion
      t.boolean :notification_confirmed
      t.decimal :amount
      t.string :responsible_party
      t.datetime :critical_time

      t.timestamps
    end
  end
end
