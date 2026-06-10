class CreateActionTextTables < ActiveRecord::Migration[8.0]
  def change
    create_table :action_text_texts do |t|
      t.text :body, size: :long
      t.timestamps
    end

    create_table :action_text_assets do |t|
      t.references :record, null: false, polymorphic: true, index: false
      t.string :name, null: false
      t.text :blob_id, null: false
      t.text :variation_digest, null: false
      t.timestamps
    end

    add_index :action_text_assets, [ :record_type, :record_id, :name ], name: "index_action_text_assets_uniqueness", unique: true
  end
end