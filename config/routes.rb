Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "return_orders#index"

  resources :return_orders, only: [:index, :show, :new, :create] do
    member do
      patch :approve_by_customer_service
      patch :receive_by_warehouse
      patch :review_by_operation
      patch :resale
      patch :report_loss
      patch :raise_dispute
    end
    resources :inspection_records, only: [:new, :create]
  end

  resources :inspection_records, only: [:show]

  get "/stats", to: "stats#index", as: :stats
end
