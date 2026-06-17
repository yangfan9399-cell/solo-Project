class CreateAnnotations < ActiveRecord::Migration[8.1]
  def change
    create_table :annotations do |t|
      t.references :run_chart, null: false, foreign_key: true
      t.references :annotatable, polymorphic: true, null: false
      t.string :type
      t.text :content
      t.float :x
      t.float :y
      t.string :status

      t.timestamps
    end
  end
end
