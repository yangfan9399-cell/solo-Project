class ChangeUserNullOnApprovalNodes < ActiveRecord::Migration[8.1]
  def change
    change_column_null :approval_nodes, :user_id, true
  end
end
