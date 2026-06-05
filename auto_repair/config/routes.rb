Rails.application.routes.draw do
  root "repair_orders#index"

  resources :vehicles do
    resources :repair_orders, only: [:index, :new]
  end

  resources :repair_orders do
    member do
      patch :submit_quote
      patch :approve_quote
      patch :reject_quote
      patch :start_repair
      patch :complete_repair
      patch :review_complete
      patch :review_return
      patch :complete_followup
      patch :archive
      patch :create_warranty_repair
    end
    resources :faults, only: [:new, :create, :edit, :update, :destroy]
    resources :quote_items, only: [:new, :create, :edit, :update, :destroy]
    resources :parts, only: [:new, :create, :edit, :update, :destroy]
    resources :repair_logs, only: [:new, :create, :edit, :update]
    resources :follow_ups, only: [:new, :create, :edit, :update] do
      member do
        get :complete
        patch :mark_complete
      end
    end
  end

  resources :users, only: [:index, :show]
end
