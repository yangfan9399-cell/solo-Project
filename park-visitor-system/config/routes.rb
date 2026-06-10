Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resources :reservations do
    member do
      post :confirm
      post :reject
    end
  end

  resources :visit_records do
    member do
      post :verify
      post :approve
      post :block
      post :record_entry
      post :record_exit
    end
  end

  resources :visitors
  resources :blacklists
  resources :departments
  resources :employees
  resources :entrances
  resources :vehicles

  get :pending_verification, to: 'visit_records#pending_verification', as: :pending_verification
  get :pending_approval, to: 'visit_records#pending_approval', as: :pending_approval

  get :analytics, to: 'analytics#index', as: :analytics

  root to: 'reservations#index'
end
