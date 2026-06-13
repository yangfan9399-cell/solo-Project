class AddMissingInspectionFields < ActiveRecord::Migration[8.1]
  def change
    add_column :inspection_records, :defect_level, :string
    add_column :inspection_records, :description, :text
    add_column :inspection_records, :department, :string
    add_column :inspection_records, :responsible_unit, :string
    add_column :inspection_records, :responsible_person, :string
    add_column :inspection_records, :contact_phone, :string
    add_column :inspection_records, :fine_amount, :decimal, default: 0
    add_column :inspection_records, :reward_amount, :decimal, default: 0
    add_column :inspection_records, :basis, :text
    add_column :inspection_records, :conclusion, :text
  end
end
