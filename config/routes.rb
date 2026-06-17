Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "projects#index"

  resources :projects do
    collection do
      get :search
    end

    member do
      get :compare
      get :history
    end

    resources :records do
      member do
        get :editor
      end

      resources :annotations, only: [:create, :update, :destroy]
      resources :scale_markers, only: [:create, :update, :destroy]
    end

    resources :exports, only: [:index, :create, :show, :destroy] do
      member do
        get :download
      end
    end
  end
end
