class CreateProcessingNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :processing_nodes do |t|
      t.references :grade_correction, null: false, foreign_key: true
      t.string :node_type
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.string :status
      t.text :content
      t.text :on_site_explanation
      t.text :business_record

      t.timestamps
    end
  end
end
