Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  delete 'logout', to: 'sessions#destroy'

  root 'home#index'

  resources :inspection_records do
    member do
      get 'handle'
      get 'review'
      post 'workflow_event', to: 'inspection_records#workflow_event'
    end
    collection do
      get 'dashboard'
      get 'review_dashboard'
      get 'handler_dashboard'
      get 'statistics'
    end
    resources :correction_records, only: [:new, :create, :edit, :update, :destroy]
    resources :evidence_attachments do
      member do
        get 'download'
      end
    end
  end

  resources :workflow_nodes, only: [:index, :show]
end
