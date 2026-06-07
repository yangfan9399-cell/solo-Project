Rails.application.routes.draw do
  get "analytics/index"
  get "issue_types/index"
  get "issue_types/new"
  get "issue_types/create"
  get "issue_types/edit"
  get "issue_types/update"
  get "issue_types/destroy"
  get "reviews/new"
  get "reviews/create"
  get "sample_versions/new"
  get "sample_versions/create"
  get "sample_versions/show"
  get "samples/index"
  get "samples/show"
  get "samples/new"
  get "samples/create"
  get "samples/edit"
  get "samples/update"
  get "up" => "rails/health#show", as: :rails_health_check

  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  resources :users

  resources :samples do
    resources :sample_versions, only: [:new, :create, :show]
    resources :reviews, only: [:new, :create]
    member do
      post :submit_for_pattern
      post :start_pattern
      post :submit_for_review
      post :start_revision
      post :finalize
      post :supervisor_confirm
    end
  end

  resources :issue_types, only: [:index, :new, :create, :edit, :update, :destroy]

  get "analytics", to: "analytics#index", as: :analytics

  root "samples#index"
end
