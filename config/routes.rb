Rails.application.routes.draw do
  root 'dashboard#index'

  resources :materials do
    resources :licenses, shallow: true
    resources :usage_scenarios, shallow: true
  end

  resources :licenses do
    member do
      post :renew
    end
  end

  resources :usage_scenarios do
    member do
      get :review
      post :legal_review
      post :operations_confirm
      post :reject
      post :remove
    end
  end

  get 'dashboard/statistics'

  get "up" => "rails/health#show", as: :rails_health_check
end