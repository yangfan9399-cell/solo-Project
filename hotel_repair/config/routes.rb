Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resource :session, only: [:new, :create, :destroy]
  get "sign_in", to: "sessions#new", as: :sign_in
  delete "sign_out", to: "sessions#destroy", as: :sign_out

  resources :repair_requests do
    member do
      post :suggest_transfer
      post :confirm_transfer
      post :submit_compensation
      post :approve_compensation
      post :reject_compensation
      post :escalate
      post :approve_escalation
      post :reject_escalation
      post :archive
      post :cancel
      post :add_feedback
    end

    collection do
      get :by_status
    end
  end

  resources :reviews, only: [:index] do
    collection do
      get :by_room_type
      get :by_category
      get :by_compensation
      get :by_duration
    end
  end

  root "repair_requests#index"
end
