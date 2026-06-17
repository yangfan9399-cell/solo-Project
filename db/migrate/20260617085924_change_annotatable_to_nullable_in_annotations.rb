class ChangeAnnotatableToNullableInAnnotations < ActiveRecord::Migration[8.1]
  def change
    change_column_null :annotations, :annotatable_id, true
    change_column_null :annotations, :annotatable_type, true
  end
end
