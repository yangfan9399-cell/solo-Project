Rails.application.routes.draw do
  root "dashboard#index"
  resources :projects do
    member do
      post :detect_anomalies
    end
    resources :page_mappings do
      collection do
        post :batch_update
        post :generate_mappings
        post :batch_number
      end
    end
    resources :batches do
      member do
        post :restore
      end
    end
    resources :export_records do
      member do
        get :download
      end
    end
    resources :anomalies do
      member do
        patch :resolve
      end
    end
  end
  get "up" => "rails/health#show", as: :rails_health_check
end
