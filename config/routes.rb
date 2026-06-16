Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root 'sessions#new'

  resource :session, only: [:new, :create, :destroy]

  resources :levels, only: [:index, :show] do
    resources :game_sessions, only: [:create]
  end

  resources :game_sessions, only: [:show] do
    member do
      patch :move_gear
      post :add_gear
      delete :remove_gear
      post :undo
      post :complete
      post :abandon
      get :calculate_rpm
      get :result
    end
  end
end
