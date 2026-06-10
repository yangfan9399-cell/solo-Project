class CreateExams < ActiveRecord::Migration[7.1]
  def change
    create_table :exams do |t|
      t.references :patient, null: false, foreign_key: true
      t.string :exam_type, null: false
      t.date :exam_date, null: false
      t.string :exam_no
      t.text :description

      t.timestamps
    end

    add_index :exams, [:patient_id, :exam_date]
  end
end