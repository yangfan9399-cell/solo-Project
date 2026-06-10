Rails.application.routes.draw do
  root "dashboard#index"

  get "auth/login", to: "sessions#new", as: :login
  post "auth/login", to: "sessions#create"
  delete "auth/logout", to: "sessions#destroy", as: :logout

  resources :applications do
    member do
      post :review
      post :approve
      post :reject
    end
  end

  resources :tracks do
    collection do
      get :search
    end
  end

  resources :contracts

  resources :settlements do
    member do
      post :confirm
      post :dispute
    end
  end

  resources :analytics, only: [:index]

  namespace :admin do
    resources :users
  end
end