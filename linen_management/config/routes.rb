Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  get "dashboard", to: "dashboard#index"
  get "statistics", to: "statistics#index"

  resources :linen_batches do
    member do
      post :collect
      post :wash_complete
      post :return_batch
      post :inspect
      post :confirm_discrepancy
      post :settle
    end

    resources :linen_items, only: [:new, :create, :edit, :update, :destroy]
    resources :damage_claims, only: [:new, :create, :edit, :update, :destroy] do
      member do
        post :confirm
      end
    end
  end

  resources :hotels
  resources :linen_types
  resources :users
end
