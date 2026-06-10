Rails.application.routes.draw do
  root "reports#index"

  resources :reports do
    member do
      post :confirm_pickup
      post :reject_pickup
      post :request_reissue
      post :approve_reissue
      post :reject_reissue
    end
    collection do
      post :request_pickup
    end
    resources :history_records, only: [:index]
  end

  resources :patients, only: [:index, :show, :new, :create]
  resources :exams, only: [:index, :show]

  namespace :admin do
    root "dashboard#index"
    resources :reports, only: [:index, :show] do
      member do
        post :approve_reissue
        post :reject_reissue
      end
    end
    resources :statistics, only: [:index]
  end

  get "/login", to: "sessions#new"
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
end