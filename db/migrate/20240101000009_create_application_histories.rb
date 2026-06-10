class CreateApplicationHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :application_histories do |t|
      t.references :application, null: false, foreign_key: true
      t.string :action, null: false
      t.references :operator, foreign_key: { to_table: :users }
      t.text :details

      t.timestamps
    end

    add_index :application_histories, :application_id
    add_index :application_histories, :action
  end
end