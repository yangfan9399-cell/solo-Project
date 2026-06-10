class CreateTrackAuthorizationScopes < ActiveRecord::Migration[8.0]
  def change
    create_table :track_authorization_scopes do |t|
      t.references :track, null: false, foreign_key: true
      t.string :scope_type, null: false
      t.string :territory, null: false
      t.date :valid_from, null: false
      t.date :valid_to, null: false

      t.timestamps
    end

    add_index :track_authorization_scopes, :track_id
    add_index :track_authorization_scopes, :scope_type
  end
end