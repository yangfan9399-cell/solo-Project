class CreateAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :attachments do |t|
      t.references :grade_correction, null: false, foreign_key: true
      t.references :processing_node, null: false, foreign_key: true
      t.string :file_name
      t.string :file_type
      t.text :description
      t.string :evidence_type

      t.timestamps
    end
  end
end
