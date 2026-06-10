class CreateRespondents < ActiveRecord::Migration[8.1]
  def change
    create_table :respondents do |t|
      t.string :name
      t.integer :type
      t.string :contact_info

      t.timestamps
    end
  end
end
