class CreateSchema < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :role, null: false, default: "front_desk"
      t.string :email, null: false
      t.string :password_digest, null: false
      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :rooms do |t|
      t.string :room_number, null: false
      t.string :room_type, null: false, default: "standard"
      t.integer :floor, null: false
      t.string :status, null: false, default: "available"
      t.timestamps
    end
    add_index :rooms, :room_number, unique: true

    create_table :repair_requests do |t|
      t.references :original_room, null: false, foreign_key: { to_table: :rooms }
      t.references :new_room, foreign_key: { to_table: :rooms }
      t.string :repair_category, null: false
      t.text :repair_reason, null: false
      t.string :status, null: false, default: "reported"
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.references :manager, foreign_key: { to_table: :users }
      t.text :customer_feedback
      t.boolean :needs_transfer, null: false, default: false
      t.boolean :needs_compensation, null: false, default: false
      t.string :transfer_suggestion
      t.string :hotel_full_reason
      t.datetime :resolved_at
      t.timestamps
    end

    create_table :compensations do |t|
      t.references :repair_request, null: false, foreign_key: true
      t.decimal :amount, null: false, precision: 10, scale: 2
      t.text :basis, null: false
      t.string :status, null: false, default: "pending"
      t.references :approved_by, foreign_key: { to_table: :users }
      t.text :rejection_reason
      t.decimal :limit_amount, null: false, precision: 10, scale: 2, default: 5000.00
      t.text :block_reason
      t.string :compensation_type, null: false, default: "room_fee_discount"
      t.timestamps
    end

    create_table :status_logs do |t|
      t.references :repair_request, null: false, foreign_key: true
      t.string :from_status
      t.string :to_status, null: false
      t.references :changed_by, null: false, foreign_key: { to_table: :users }
      t.text :note
      t.timestamps
    end

    create_table :approval_escalations do |t|
      t.references :repair_request, null: false, foreign_key: true
      t.references :compensation, null: false, foreign_key: true
      t.string :level, null: false, default: "senior_manager"
      t.string :status, null: false, default: "pending"
      t.references :approved_by, foreign_key: { to_table: :users }
      t.text :reason, null: false
      t.text :review_note
      t.decimal :suggested_amount, precision: 10, scale: 2
      t.timestamps
    end
  end
end
