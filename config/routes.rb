Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root to: 'dashboard#index'

  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  delete 'logout', to: 'sessions#destroy'
  post 'switch_user/:id', to: 'sessions#switch_user', as: :switch_user

  get 'dashboard', to: 'dashboard#index'
  get 'dashboard/review', to: 'dashboard#review'
  get 'dashboard/statistics', to: 'dashboard#statistics'

  resources :grade_corrections do
    member do
      post 'accept'
      post 'start_processing'
      post 'submit_for_review'
      post 'approve'
      post 'reject'
      post 'return_to_processor'
      post 'reprocess'
      post 'reopen'
      post 'add_business_record'
      post 'add_attachment'
      get 'processing'
      get 'review'
    end

    collection do
      get 'filter'
    end
  end

  resources :processing_nodes, only: [:show]
  resources :attachments, only: [:show, :destroy]
end
