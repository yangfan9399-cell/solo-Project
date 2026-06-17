class RemoveNotNullFromCharacterBoxesInscription < ActiveRecord::Migration[8.1]
  def change
    change_column_null :character_boxes, :inscription_id, true
  end
end
