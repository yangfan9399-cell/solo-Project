class FixCorrectionRecordsFields < ActiveRecord::Migration[8.1]
  def change
    rename_column :correction_records, :correction_measures, :correction_measure
    remove_column :correction_records, :basis, :text
    add_column :correction_records, :correction_result, :text
    add_column :correction_records, :operator, :string
    add_column :correction_records, :remark, :text
  end
end
