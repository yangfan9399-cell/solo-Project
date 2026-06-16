Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "home#index"

  resources :players, only: [:new, :create, :show] do
    member do
      patch :update_name
    end
  end

  resources :levels, only: [:index, :show] do
    resources :game_sessions, only: [:new, :create]
  end

  resources :game_sessions, only: [:index, :show, :destroy] do
    member do
      post :place_container
      post :remove_container
      post :undo
      post :redo
      post :recalculate_score
      post :time_expired
      post :cancel
      get :operations
    end
  end

  resources :leaderboards, only: [:index]
end
